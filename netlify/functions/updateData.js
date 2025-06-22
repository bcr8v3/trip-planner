const { Octokit } = require("@octokit/rest");

exports.handler = async function(event, context) {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*', // Adjust this to your domain in production
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ message: "Method Not Allowed" })
    };
  }

  try {
    // Log environment variable existence (not the value for security)
    console.log('TOKEN environment variable is set:', !!process.env.TOKEN);
    
    const octokit = new Octokit({
      auth: process.env.TOKEN
    });

    console.log('Parsing event body');
    const { data } = event.body ? JSON.parse(event.body) : {};
    
    if (!data) {
      console.log('No data provided in request');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "No data provided" })
      };
    }

    console.log('Fetching current file from GitHub');
    // First get the current file to get its SHA
    const { data: currentFile } = await octokit.repos.getContent({
      owner: "bcr8v3",
      repo: "trip-planner",
      path: "data.json"
    });

    console.log('Updating file in GitHub');
    // Update the file
    await octokit.repos.createOrUpdateFileContents({
      owner: "bcr8v3",
      repo: "trip-planner",
      path: "data.json",
      message: "Update trip data",
      content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
      sha: currentFile.sha
    });
    
    console.log('File updated successfully');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: "Data updated successfully",
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: "Error updating data", 
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
