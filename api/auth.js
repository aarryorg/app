// Vercel Serverless Function
// This function will live at the endpoint /api/auth
// It securely handles the exchange of the authorization code for an access token.

import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { code, codeVerifier, redirectUri } = req.body;

    if (!code || !codeVerifier || !redirectUri) {
        return res.status(400).json({ error: 'Missing required parameters: code, codeVerifier, or redirectUri' });
    }

    // These secrets are stored securely as Environment Variables in Vercel, not in the code.
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error("Missing environment variables on the server.");
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: codeVerifier,
    });

    try {
        // Step 1: Exchange authorization code for access token
        const tokenResponse = await axios.post(tokenUrl, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            throw new Error('Access token not found in response');
        }

        // Step 2: Use the access token to get user's profile info
        const profileUrl = 'https://api.linkedin.com/v2/userinfo';
        const profileResponse = await axios.get(profileUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        // Step 3: Send the real profile data back to the frontend
        res.status(200).json(profileResponse.data);

    } catch (error) {
        console.error('Error during LinkedIn authentication:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to authenticate with LinkedIn.' });
    }
}

