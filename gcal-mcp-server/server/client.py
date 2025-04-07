from dotenv import load_dotenv
import os

load_dotenv()

import asyncio
import datetime
from textwrap import dedent

from agno.agent import Agent
from agno.models.azure.openai_chat import AzureOpenAI
from agno.tools.mcp import MCPTools
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def create_filesystem_agent(session):
    """Create and configure a high-performance filesystem agent with Groq and MCP."""
    # Initialize the MCP toolkit
    mcp_tools = MCPTools(session=session)
    await mcp_tools.initialize()

    llm = AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    )
    # Create an agent with the MCP toolkit and Groq's fast LLM
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    return Agent(
        model=llm,
        tools=[mcp_tools],
        instructions=dedent(f"""\
            you are an helpful assistant use the available tools (if applicable) to answer the user's questions.
                use `primary` calender unless otherwise specified to perform operations

            today is {today}
            
        """),
        markdown=True,
        show_tool_calls=True,
    )


async def run_agent(message: str) -> None:
    """Run the filesystem agent with the given message."""
    # Initialize the MCP server
    server_params = StdioServerParameters(
        command="uv",
        args=[
            "run",
            "--with",
            "mcp",
            "mcp",
            "run",
            "server.py",
            # str(Path(__file__).parent.parent.parent.parent),
        ],
    )

    # Create a client session to connect to the MCP server
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            agent = await create_filesystem_agent(session)

            # Run the agent
            await agent.aprint_response(message, stream=True)


# Example usage
if __name__ == "__main__":
    while True:
        query = input("Enter a query:\n ")
        asyncio.run(run_agent(query))

        # asyncio.run(run_agent("are there any upcomming events"))
