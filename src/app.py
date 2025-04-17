from mcp.server.mcp_server import MCPServer
import asyncio
import yaml

async def main():
    with open("src/mcp/config/notion_config.yml") as f:
        config = yaml.safe_load(f)
    
    server = MCPServer(config)
    
    # Download a specific Notion page
    document = await server.tools["notion"].download_document("your-page-id")
    print(f"Downloaded document: {document['metadata']['title']}")

if __name__ == "__main__":
    asyncio.run(main())