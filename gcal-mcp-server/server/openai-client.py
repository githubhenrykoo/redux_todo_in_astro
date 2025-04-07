import asyncio
import os

from agents import Agent, Runner, set_default_openai_client
from agents.mcp import MCPServer, MCPServerSse
from agents.model_settings import ModelSettings
from dotenv import load_dotenv
from openai import AsyncAzureOpenAI

load_dotenv()

openai_client = AsyncAzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
)
set_default_openai_client(openai_client)


async def run(mcp_server: MCPServer):
    response = await openai_client.chat.completions.create(
        messages=[{"role": "user", "content": "hi"}],
        model="gpt-4o-c0de",
    )

    print(response)

    agent = Agent(
        name="Assistant",
        instructions="Use the tools to answer the questions.",
        mcp_servers=[mcp_server],
        model_settings=ModelSettings(tool_choice="required"),
        model=AsyncAzureOpenAI,
    )

    # Use the `add` tool to add two numbers
    message = "what are the available calneders and upcoming events"
    print(f"Running: {message}")
    result = await Runner.run(starting_agent=agent, input=message)
    print(result.final_output)


async def main():
    async with MCPServerSse(
        name="SSE Python Server",
        params={
            "url": "http://localhost:8000/sse",
        },
    ) as server:
        await run(server)


if __name__ == "__main__":
    asyncio.run(main())
