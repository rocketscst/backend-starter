import axios from 'axios'

interface GoogleResponse {
  name?: string //made name optional
  email: string
}

export default async function getGoogleUser(
  accessToken: string
): Promise<GoogleResponse> {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`
    )

    console.log('✅ Google API Response:', response.data) // Log success response

    if (!response.data.name) {
      console.log("🚨 WARNING: 'name' is missing in Google response!")
    }

    return response.data
  } catch (error) {
    console.error('🚨 Google API Error:', error.response?.data || error.message)
    throw error
  }
  // return (
  //   await axios(
  //     `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`
  //   )
  // ).data //changed from v3 to v1
}
