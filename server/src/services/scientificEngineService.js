const cp = require('child_process');

const SCIENTIFIC_ENGINE_URL = process.env.SCIENTIFIC_ENGINE_URL || 'http://localhost:5002';

/**
 * Sends a propagation request to the external Python scientific propagation service.
 * Performs a synchronous execution via a child Node process to maintain synchronous
 * compatibility with the existing route controllers without installing third-party packages.
 * 
 * @param {Object} payload - The propagation parameters including orbitalObject, duration, and interval.
 * @returns {Object} The propagation result from the Python engine, or a connection failure object.
 */
const requestOrbitPropagation = (payload) => {
  try {
    const url = `${SCIENTIFIC_ENGINE_URL}/propagate`;
    const payloadStr = JSON.stringify(payload);

    // Node.js script to run in the child process to perform the fetch request
    const nodeScript = `
      fetch(process.env.TARGET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: process.env.PAYLOAD_DATA
      })
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(data => console.log(JSON.stringify({ success: true, data })))
      .catch(err => console.log(JSON.stringify({ success: false, error: err.message })));
    `;

    // Execute the Node script synchronously, passing parameters through env vars to prevent shell escaping issues
    const stdout = cp.execSync(`node -e ${JSON.stringify(nodeScript)}`, {
      env: {
        ...process.env,
        TARGET_URL: url,
        PAYLOAD_DATA: payloadStr,
      },
      encoding: 'utf-8',
      timeout: 4000, // 4-second timeout
    });

    const result = JSON.parse(stdout.trim());
    if (result.success) {
      return {
        connected: true,
        ...result.data,
      };
    }

    return {
      connected: false,
      message: `Scientific propagation service unavailable: ${result.error}`,
    };
  } catch (error) {
    return {
      connected: false,
      message: `Scientific propagation service unavailable: ${error.message}`,
    };
  }
};

module.exports = {
  requestOrbitPropagation,
};
