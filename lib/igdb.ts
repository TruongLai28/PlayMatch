import axios from 'axios'

interface IGDBAuthResponse {
  access_token: string
  expires_in: number
}

class IGDBClient {
  private clientId: string
  private clientSecret: string
  private accessToken: string | null = null

  constructor() {
    this.clientId = process.env.IGDB_CLIENT_ID!
    this.clientSecret = process.env.IGDB_CLIENT_SECRET!
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken

    const response = await axios.post('https://id.twitch.tv/oauth2/token', {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials'
    })

    this.accessToken = response.data.access_token
    return this.accessToken!
  }

  async searchGames(query: string) {
    const token = await this.getAccessToken()
    
    const response = await axios.post('https://api.igdb.com/v4/games', 
      `fields name,cover.url; search "${query}"; limit 10;`,
      {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
        }
      }
    )

    return response.data
  }

  async getAllGames(limit: number = 50, offset: number = 0) {
    const token = await this.getAccessToken()
    
    const response = await axios.post('https://api.igdb.com/v4/games', 
      `fields name,cover.url,rating,first_release_date,genres.name,platforms.name,summary; 
       where rating > 0; 
       sort id desc; 
       limit ${limit}; 
       offset ${offset};`,
      {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
        }
      }
    )

    return response.data
  }
  
  //helper for IGDB endpoints like genre and games
  async apiRequest(endpoint: string, body: string) {
    const token = await this.getAccessToken()

    const response = await axios.post(`https://api.igdb.com/v4/${endpoint}`, body, {
      headers: {
        'Client-ID': this.clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      }
    })
    return response.data
  }
}

export const igdbClient = new IGDBClient()