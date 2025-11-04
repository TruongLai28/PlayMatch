// lib/igdb.ts (Enhanced version)
import axios from 'axios'

interface IGDBAuthResponse {
  access_token: string
  expires_in: number
}

interface Game {
  id: number
  name: string
  cover?: {
    id: number
    url: string
  }
  summary?: string
  rating?: number
  genres?: Array<{ id: number; name: string }>
  platforms?: Array<{ id: number; name: string }>
  release_dates?: Array<{ date: number; platform: number }>
  screenshots?: Array<{ id: number; url: string }>
}

class IGDBClient {
  private clientId: string
  private clientSecret: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    this.clientId = process.env.IGDB_CLIENT_ID!
    this.clientSecret = process.env.IGDB_CLIENT_SECRET!
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const response = await axios.post<IGDBAuthResponse>('https://id.twitch.tv/oauth2/token', {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials'
    })

    this.accessToken = response.data.access_token
    this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000 // Refresh 1 minute early
    return this.accessToken
  }

  private async makeRequest(endpoint: string, query: string): Promise<Game[]> {
    try {
      const token = await this.getAccessToken()
      
      console.log(`IGDB API: Making request to ${endpoint} with query:`, query.trim())
      
      const response = await axios.post(`https://api.igdb.com/v4/${endpoint}`, query, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        }
      })

      console.log(`IGDB API: Received ${response.data.length} results from ${endpoint}`)
      if (response.data.length === 0) {
        console.log('IGDB API: Zero results - this could be due to search term not found or API limits')
      }
      return response.data
    } catch (error: any) {
      console.error(`IGDB API Error for ${endpoint}:`, error)
      if (error.response) {
        console.error('IGDB API Response Error:', error.response.status, error.response.data)
      }
      throw error
    }
  }

  async searchGames(query: string): Promise<Game[]> {
    // First try a basic search without additional filters
    const igdbQuery = `
      fields name, cover.url, summary, rating, genres.name, platforms.name, first_release_date;
      search "${query}";
      limit 500;
    `
    
    return this.makeRequest('games', igdbQuery)
  }

  async getPopularGames(): Promise<Game[]> {
    const igdbQuery = `
      fields name, cover.url, summary, rating, genres.name, platforms.name;
      where rating > 80 & rating_count > 100 & category = 0;
      sort rating desc;
      limit 7;
    `
    
    return this.makeRequest('games', igdbQuery)
  }

  async getPopularReleasedGames(
    limit: number = 10,
    offset: number = 0
  ): Promise<Game[]> {
    const token = await this.getAccessToken();

    const response = await axios.post(
      "https://api.igdb.com/v4/games",
      `fields name,cover.url,rating,first_release_date,genres.name,platforms.name,summary,themes.name,keywords.name,game_modes.name,player_perspectives.name,age_ratings.rating,age_ratings.category,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,release_dates.date,release_dates.platform.name,similar_games.name,screenshots.url; 
      where rating > 60 & rating_count > 10 & first_release_date != null & first_release_date < ${Math.floor(Date.now() / 1000)}; 
      sort rating desc; 
      limit ${limit}; 
      offset ${offset};`,
      {
        headers: {
          "Client-ID": this.clientId,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  }

  async getNewReleases(): Promise<Game[]> {
    const oneYearAgo = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000)
    const now = Math.floor(Date.now() / 1000)
    
    const igdbQuery = `
      fields name, cover.url, summary, rating, genres.name, release_dates.date;
      where release_dates.date > ${oneYearAgo} & release_dates.date < ${now} & rating > 50 & category = 0;
      sort release_dates.date desc;
      limit 12;
    `
    
    return this.makeRequest('games', igdbQuery)
  }

  async getRecommendations(userPreferences?: string[]): Promise<Game[]> {
    // Basic recommendation logic - can be enhanced with user preferences
    const igdbQuery = `
      fields name, cover.url, summary, rating, genres.name;
      where rating > 70 & rating_count > 20 & category = 0;
      sort rating desc;
      limit 12;
    `
    
    return this.makeRequest('games', igdbQuery)
  }

  async getGameDetails(gameId: number): Promise<Game> {
    const igdbQuery = `
      fields name, cover.url, summary, rating, genres.name, platforms.name, 
             release_dates.date, screenshots.url;
      where id = ${gameId};
    `
    
    const games = await this.makeRequest('games', igdbQuery)
    return games[0]
  }

  async getSimilarGames(gameId: number): Promise<Game[]> {
    const igdbQuery = `
      fields name, cover.url, summary, rating, genres.name;
      where similar_games = ${gameId} & rating > 60;
      sort rating desc;
      limit 7;
    `
    
    return this.makeRequest('games', igdbQuery)
  }

  // Alias for backwards compatibility with rec-engine route
  async apiRequest(endpoint: string, query: string): Promise<Game[]> {
    return this.makeRequest(endpoint, query)
  }
}

export const igdbClient = new IGDBClient()
