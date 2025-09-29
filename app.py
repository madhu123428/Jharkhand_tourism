from flask import Flask, render_template, request, jsonify
import os
from typing import TypedDict, Annotated, Sequence, List, Optional
import operator
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("Please set your GOOGLE_API_KEY in the .env file.")

# LangChain and LangGraph Imports
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END

app = Flask(__name__)

# --- MOCK DATABASE ---
MOCK_DATABASE = {
    "Ranchi": {
        "attractions": ["Dassam Falls", "Jagannath Temple", "Rock Garden"],
        "restaurants": ["Kavery Restaurant", "The Great Kebab Factory", "Capitol Residency"]
    },
    "Jamshedpur": {
        "attractions": ["Jubilee Park", "Dalma Wildlife Sanctuary", "Tata Steel Zoological Park"],
        "restaurants": ["The Blue Diamond", "Equinox Restaurant", "Brubeck Bakery"]
    },
    "Bokaro": {
        "attractions": ["Jawaharlal Nehru Biological Park", "City Park", "Garga Dam"],
        "restaurants": ["Hotel Aryan Residency", "Madhuban Restaurant", "Kwality Restaurant"]
    },
    "Dhanbad": {
        "attractions": ["Maithon Dam", "Panchet Dam", "Topchanchi Lake"],
        "restaurants": ["Hotel Galaxy", "Bombay Restaurant", "Kwality Restaurant"]
    }
}


# --- AGENT STATE ---
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    cities: Optional[List[str]]
    days: Optional[int]
    people: Optional[int]
    budget: Optional[int]
    transport: Optional[str]


# --- TOOLS ---
@tool
def get_required_information(
        cities: Optional[List[str]] = None,
        days: Optional[int] = None,
        people: Optional[int] = None,
        budget: Optional[int] = None,
        transport: Optional[str] = None
):
    """Gathers and validates required information. Asks user for missing info."""
    missing = []
    if not cities: missing.append("which cities you are visiting")
    if not days: missing.append("for how many days")
    if not people: missing.append("how many people are traveling")
    if not budget: missing.append("your approximate budget")
    if missing:
        return {"status": "missing_info",
                "prompt": f"I need a bit more info. Can you please tell me {', '.join(missing)}?"}
    return {"status": "complete",
            "details": {"cities": cities, "days": days, "people": people, "budget": budget, "transport": transport}}


@tool
def create_travel_itinerary(cities: List[str], days: int, people: int, budget: int, transport: Optional[str] = None):
    """Creates a day-wise travel itinerary once all information is gathered."""
    if not cities or len(cities) < 1: return "Error: At least one city is required."
    itinerary = ""
    itinerary += f"✨ Trip Plan for {', '.join(cities)} ✨\nDuration: {days} Days | Travelers: {people} | Budget: ₹{budget:,}\n{'=' * 50}\n\n"
    days_per_city = max(1, days // len(cities))
    remaining_days = days % len(cities) if len(cities) > 0 else 0
    day_counter = 1
    transport_options = ["Car/Taxi", "Train", "Flight"]
    for idx, city in enumerate(cities):
        data = MOCK_DATABASE.get(city, {"attractions": ["N/A"], "restaurants": ["N/A"]})
        city_days = days_per_city + (1 if idx < remaining_days else 0)
        for d in range(city_days):
            itinerary += f"🗓️ Day {day_counter}: Exploring {city}\n"
            att1 = data["attractions"][d % len(data["attractions"])]
            att2 = data["attractions"][(d + 1) % len(data["attractions"])] if len(data["attractions"]) > 1 else "N/A"
            lunch = data["restaurants"][d % len(data["restaurants"])]
            dinner = data["restaurants"][(d + 1) % len(data["restaurants"])] if len(data["restaurants"]) > 1 else "N/A"
            itinerary += f"  - Visit: {att1} & {att2}\n  - Lunch: {lunch}\n  - Dinner: {dinner}\n"
            if idx < len(cities) - 1 and d == city_days - 1:
                next_city = cities[idx + 1]
                mode = transport if transport else random.choice(transport_options)
                itinerary += f"  - Travel to {next_city} via {mode}\n"
            itinerary += "\n"
            day_counter += 1
    itinerary += "Have a wonderful trip!\n"
    return itinerary


# --- LANGGRAPH SETUP ---
def create_agent_graph():
    tools = [get_required_information, create_travel_itinerary]
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key=GOOGLE_API_KEY,
        temperature=0.7,
    )
    llm_with_tools = llm.bind_tools(tools)

    def agent_node(state: AgentState):
        response = llm_with_tools.invoke(state["messages"])
        updates = {"messages": [response]}
        if response.tool_calls:
            for call in response.tool_calls:
                if call['name'] == 'get_required_information':
                    for key, value in call['args'].items():
                        if value is not None:
                            if key == 'cities' and isinstance(value, str):
                                updates[key] = [value]
                            else:
                                updates[key] = value
        return updates

    def tool_node(state: AgentState):
        last = state["messages"][-1]
        msgs = []
        for call in getattr(last, "tool_calls", []):
            func = globals().get(call["name"])
            if func:
                tool_result = func.invoke(call["args"])
                msgs.append(ToolMessage(content=str(tool_result), tool_call_id=call["id"]))
        return {"messages": msgs}

    def should_continue(state: AgentState):
        if getattr(state["messages"][-1], "tool_calls", []):
            return "tools"
        return END

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue)
    graph.add_edge("tools", "agent")
    return graph.compile()


# Global agent instance
runnable_graph = create_agent_graph()

# Store conversations
conversations = {}


@app.route('/')
def index():
    """Main landing page"""
    return render_template('index.html')


@app.route('/planner')
def planner():
    """Trip planner chat interface"""
    # Get the optional prompt parameter if user came from the main page
    initial_prompt = request.args.get('prompt', '')
    return render_template('chat.html', initial_prompt=initial_prompt)


@app.route('/chat', methods=['POST'])
def chat():
    """API endpoint for chat messages"""
    data = request.json
    user_input = data.get('message', '')
    conversation_id = data.get('conversation_id', str(random.randint(1000, 9999)))

    if conversation_id not in conversations:
        conversations[conversation_id] = {
            "messages": [],
            "cities": None,
            "days": None,
            "people": None,
            "budget": None,
            "transport": None
        }

    state = conversations[conversation_id]
    state["messages"].append(HumanMessage(content=user_input))

    # Process with agent
    final_state = runnable_graph.invoke(state)

    # Get agent response
    agent_response = final_state["messages"][-1].content if final_state[
        "messages"] else "Sorry, I couldn't process that."

    # Update conversation state
    conversations[conversation_id] = final_state

    return jsonify({
        'response': agent_response,
        'conversation_id': conversation_id
    })

@app.route('/dash')
def dashboard():
    return render_template('dashboard-main.html')

@app.route('/cities')
def get_cities():
    """API endpoint to get available cities"""
    return jsonify(list(MOCK_DATABASE.keys()))


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5004)