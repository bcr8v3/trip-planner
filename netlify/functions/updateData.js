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
    
    if (!process.env.TOKEN) {
      console.error('GitHub TOKEN is not set in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          message: "Server configuration error: GitHub token not set", 
          timestamp: new Date().toISOString()
        })
      };
    }
    
    const octokit = new Octokit({
      auth: process.env.TOKEN
    });

    console.log('Parsing event body');
    let data;
    try {
      data = event.body ? JSON.parse(event.body).data : undefined;
      console.log('Received data structure:', JSON.stringify({
        hasData: !!data,
        isObject: typeof data === 'object',
        keysIfObject: data && typeof data === 'object' ? Object.keys(data) : null
      }));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: "Invalid JSON in request body", 
          error: parseError.message,
          timestamp: new Date().toISOString()
        })
      };
    }
    
    if (!data) {
      console.log('No data provided in request');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "No data provided" })
      };
    }

    console.log('Fetching current file from GitHub');
    let currentFile;
    try {
      const response = await octokit.repos.getContent({
        owner: "bcr8v3",
        repo: "trip-planner",
        path: "data.json"
      });
      currentFile = response.data;
      console.log('Successfully fetched file, SHA:', currentFile.sha);
    } catch (githubError) {
      console.error('Error fetching file from GitHub:', githubError);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ 
          message: "Error fetching file from GitHub", 
          error: githubError.message,
          timestamp: new Date().toISOString()
        })
      };
    }

    console.log('Updating file in GitHub');
    // Update the file
    try {
      await octokit.repos.createOrUpdateFileContents({
        owner: "bcr8v3",
        repo: "trip-planner",
        path: "data.json",
        message: "Update trip data",
        content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
        sha: currentFile.sha
      });
      console.log('GitHub update API call completed successfully');
    } catch (updateError) {
      console.error('Error updating file in GitHub:', updateError);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ 
          message: "Error updating file in GitHub", 
          error: updateError.message,
          timestamp: new Date().toISOString()
        })
      };
    }
    
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
