import asyncio
import os
from browser_use import Agent
from browser_use.llm import ChatGoogle # Keep this import, we just change the config
from langchain_google_genai import ChatGoogleGenerativeAI

async def main():
    # 1. Set your key
    os.environ["GOOGLE_API_KEY"] = "AIzaSyBvxXMr7gGRsKlRSj_KQ-k0dh0B04eD6gE"

    # 2. Initialize Gemini (Fast and free)
    llm = ChatGoogle(model='gemini-1.5-flash-latest')
    
    task = "Go to http://localhost:5173 and test the textile inventory form."

    # 3. Optimized Agent for weak hardware
    agent = Agent(
        task=task,
        llm=llm,
        browser_context_config={
            "viewport": {"width": 800, "height": 600},
            "headless": True  # RUNS IN BACKGROUND (Saves your laptop from lagging)
        }
    )

    history = await agent.run()
    print(history)

if __name__ == "__main__":
    asyncio.run(main())