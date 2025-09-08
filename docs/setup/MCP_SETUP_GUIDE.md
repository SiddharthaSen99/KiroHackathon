# MCP Server Setup Guide for Windows

## Issue Resolution
The MCP servers are failing because `uvx` (part of the `uv` Python package manager) is not installed on your Windows system. Here's how to fix it:

## Option 1: Install UV Package Manager (Recommended)

### Step 1: Install UV
Choose one of these methods:

#### Method A: Using PowerShell (Recommended)
```powershell
# Run in PowerShell as Administrator
irm https://astral.sh/uv/install.ps1 | iex
```

#### Method B: Using pip (if you have Python)
```bash
pip install uv
```

#### Method C: Using Chocolatey (if you have Chocolatey)
```bash
choco install uv
```

#### Method D: Using Scoop (if you have Scoop)
```bash
scoop install uv
```

### Step 2: Verify Installation
```bash
# Check if uv and uvx are available
uv --version
uvx --version
```

### Step 3: Enable MCP Servers
Once UV is installed, you can enable the MCP servers by changing `"disabled": true` to `"disabled": false` in `.kiro/settings/mcp.json`.

## Option 2: Alternative MCP Server Configurations

If you prefer not to install UV, here are alternative configurations:

### Using Node.js-based MCP Servers
```json
{
    "mcpServers": {
        "filesystem-node": {
            "command": "npx",
            "args": ["@modelcontextprotocol/server-filesystem", "."],
            "disabled": false,
            "autoApprove": ["read_file", "list_directory"]
        },
        "git-node": {
            "command": "npx", 
            "args": ["@modelcontextprotocol/server-git"],
            "disabled": false,
            "autoApprove": ["git_status", "git_log"]
        }
    }
}
```

### Using Direct Python Execution (if Python is installed)
```json
{
    "mcpServers": {
        "filesystem-python": {
            "command": "python",
            "args": ["-m", "mcp_server_filesystem", "--base-directory", "."],
            "disabled": false,
            "autoApprove": ["read_file", "list_directory"]
        }
    }
}
```

## Option 3: Simplified Configuration for Demonstration

For now, I've disabled all MCP servers to prevent the error messages. The Kiro showcase still demonstrates the configuration and potential capabilities.

## MCP Server Capabilities

### Once Working, These Servers Provide:

#### Filesystem Server
- `read_file` - Read file contents
- `list_directory` - List directory contents  
- `search_files` - Search for files by pattern
- `write_file` - Write content to files
- `create_directory` - Create new directories

#### Git Server
- `git_status` - Show repository status
- `git_log` - Show commit history
- `git_diff` - Show file differences
- `git_show` - Show commit details
- `git_add` - Stage files for commit

#### GitHub Server (requires GITHUB_PERSONAL_ACCESS_TOKEN)
- `search_repositories` - Search GitHub repositories
- `get_file_contents` - Read files from GitHub repos
- `list_issues` - List repository issues
- `create_issue` - Create new issues
- `get_pull_requests` - List pull requests

#### Docker Server
- `list_containers` - List Docker containers
- `get_container_info` - Get container details
- `container_logs` - View container logs
- `start_container` - Start containers
- `stop_container` - Stop containers

## Testing MCP Server Installation

### Step 1: Test UV Installation
```bash
# Test uvx with a simple command
uvx --help
```

### Step 2: Test MCP Server Installation
```bash
# Test filesystem server
uvx mcp-server-filesystem --help

# Test git server  
uvx mcp-server-git --help
```

### Step 3: Enable Servers Gradually
1. Start with just the filesystem server
2. Test that it connects successfully
3. Enable additional servers one by one

## Troubleshooting

### Common Issues

#### "uvx is not recognized"
- UV is not installed or not in PATH
- Restart your terminal after installation
- Check if UV was installed correctly with `uv --version`

#### "Connection timeout"
- Server is taking too long to start
- Check if the server package exists
- Verify network connectivity for package downloads

#### "Permission denied"
- Run terminal as Administrator
- Check file permissions in the project directory
- Ensure antivirus isn't blocking the execution

### Debug Steps
1. Check Kiro MCP logs in the IDE
2. Test MCP servers manually in terminal
3. Verify environment variables are set
4. Check network connectivity

## Benefits Once Working

### Enhanced Development Experience
- **File Operations**: Direct file manipulation through Kiro
- **Git Integration**: Repository operations without leaving IDE
- **GitHub Integration**: Issue tracking and code search
- **Container Management**: Docker operations for deployment
- **Database Access**: Direct database queries and schema inspection

### Workflow Improvements
- **Unified Interface**: All tools accessible through Kiro
- **Context Awareness**: MCP servers understand project context
- **Automated Operations**: Hooks can leverage MCP capabilities
- **Cross-Tool Integration**: Combine multiple MCP servers for complex workflows

## Next Steps

1. **Install UV**: Follow Option 1 above
2. **Test Installation**: Verify uvx works
3. **Enable Servers**: Update mcp.json configuration
4. **Test Integration**: Try MCP server commands in Kiro
5. **Configure APIs**: Add GitHub tokens and other API keys as needed

## Current Status

✅ **Kiro Features Demonstrated**: Specs, Hooks, Steering Rules all working  
⚠️ **MCP Servers**: Temporarily disabled due to missing UV installation  
🎯 **Showcase Complete**: All advanced Kiro features successfully implemented  

The MCP servers are an additional enhancement - the core Kiro showcase with Specs, Hooks, and Steering Rules is fully functional and demonstrates sophisticated IDE usage!