import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { normalize, Game } from '../../../lib/search-query'
import { filterByGenre } from '../../../lib/filterByGenre'
import { filterByYear } from '../../../lib/filterByYear'
import { filterByPlatform } from '../../../lib/filterByPlatform'
import { filterByRating } from '../../../lib/filterByRating'

/**
 * @swagger
 * /api/new-search-games:
 *   get:
 *     tags:
 *       - Search
 *     summary: Search games from Supabase and IGDB
 *     description: >
 *       Searches the local Supabase database first. If fewer than 500 games are found, falls back
 *       to IGDB to fetch up to 500 rated games. Supports optional genre filtering by ID.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Game name to search for
 *       - in: query
 *         name: genre_id
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *             enum: [2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 24, 25, 26, 30, 31, 32, 33, 34, 35, 36]  # Add all your genre IDs here
 *           default: []
 *         style: form
 *         explode: true
 *         required: false
 *         description: >
 *           Filter by genre ID (can select multiple with crtl + left click).  
 *           Point-and-click:2, Fighting:4, Shooter:5, Music:7, Platform:8, Puzzle:9, Racing:10, Real Time Strategy (RTS):11, Role-playing (RPG):12, Simulator:13, Sport:14, Strategy:15, Turn-based Strategy (TBS):16, Tactical:24, Hack & slash/Beat ’em up:25, Quiz/Trivia:26, Pinball:30, Adventure:31, Indie:32, Arcade:33, Visual Novel:34, Card & Board Game:35, MOBA:36
 *       - in: query
 *         name: platform_id
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *             enum:
 *               - 3    # Linux
 *               - 4    # Nintendo 64
 *               - 5    # Wii
 *               - 6    # PC (Windows)
 *               - 7    # PlayStation
 *               - 8    # PlayStation 2
 *               - 9    # PlayStation 3
 *               - 11   # Xbox
 *               - 12   # Xbox 360
 *               - 13   # PC DOS
 *               - 14   # Mac
 *               - 15   # Commodore 64
 *               - 16   # Amiga
 *               - 18   # NES
 *               - 19   # SNES
 *               - 20   # Nintendo DS
 *               - 21   # GameCube
 *               - 22   # Game Boy Color
 *               - 23   # Dreamcast
 *               - 24   # Game Boy Advance
 *               - 25   # Amstrad CPC
 *               - 26   # ZX Spectrum
 *               - 27   # MSX
 *               - 29   # Sega Genesis
 *               - 30   # Sega 32X
 *               - 32   # Sega Saturn
 *               - 33   # Game Boy
 *               - 34   # Android
 *               - 35   # Sega Game Gear
 *               - 36   # Xbox Live Arcade
 *               - 37   # Nintendo 3DS
 *               - 38   # PSP
 *               - 39   # iOS
 *               - 41   # Wii U
 *               - 42   # N-Gage
 *               - 44   # Tapwave Zodiac
 *               - 45   # PlayStation Network
 *               - 46   # PlayStation Vita
 *               - 47   # Virtual Console
 *               - 48   # PlayStation 4
 *               - 49   # Xbox One
 *               - 50   # 3DO
 *               - 51   # Famicom Disk System
 *               - 52   # Arcade
 *               - 53   # MSX2
 *               - 55   # Mobile
 *               - 56   # WiiWare
 *               - 57   # WonderSwan
 *               - 58   # Super Famicom
 *               - 59   # Atari 2600
 *               - 60   # Atari 7800
 *               - 61   # Atari Lynx
 *               - 62   # Atari Jaguar
 *               - 63   # Atari ST
 *               - 64   # Sega Master System
 *               - 65   # Atari 8-bit
 *               - 66   # Atari 5200
 *               - 67   # Intellivision
 *               - 68   # ColecoVision
 *               - 69   # BBC Micro
 *               - 70   # Vectrex
 *               - 71   # Commodore VIC-20
 *               - 72   # Ouya
 *               - 73   # BlackBerry OS
 *               - 74   # Windows Phone
 *               - 75   # Apple II
 *               - 77   # Sharp X1
 *               - 78   # Sega CD
 *               - 79   # Neo Geo MVS
 *               - 80   # Neo Geo AES
 *               - 82   # Web Browser
 *               - 84   # SG-1000
 *               - 85   # Donner Model 30
 *               - 86   # TurboGrafx-16 / PC Engine
 *               - 87   # Virtual Boy
 *               - 88   # Odyssey
 *               - 89   # Microvision
 *               - 90   # Commodore PET
 *               - 91   # Bally Astrocade
 *               - 92   # SteamOS
 *               - 93   # Commodore 16
 *               - 94   # Commodore Plus/4
 *               - 95   # PDP-1
 *               - 96   # PDP-10
 *               - 97   # PDP-8
 *               - 98   # DEC GT40
 *               - 99   # Famicom
 *               - 100  # Analogue Electronics
 *               - 101  # Ferranti Nimrod Computer
 *               - 102  # EDSAC
 *               - 103  # PDP-7
 *               - 104  # HP 2100
 *               - 105  # HP 3000
 *               - 106  # SDS Sigma 7
 *               - 107  # Call-A-Computer System
 *               - 108  # PDP-11
 *               - 109  # CDC Cyber 70
 *               - 110  # PLATO
 *               - 111  # Imlac PDS-1
 *               - 112  # Microcomputer
 *               - 113  # OnLive Game System
 *               - 114  # Amiga CD32
 *               - 115  # Apple IIGS
 *               - 116  # Acorn Archimedes
 *               - 117  # Philips CD-i
 *               - 118  # FM Towns
 *               - 119  # Neo Geo Pocket
 *               - 120  # Neo Geo Pocket Color
 *               - 121  # Sharp X68000
 *               - 122  # Nuon
 *               - 123  # WonderSwan Color
 *               - 124  # SwanCrystal
 *               - 125  # PC-8801
 *               - 126  # TRS-80
 *               - 127  # Fairchild Channel F
 *               - 128  # PC Engine SuperGrafx
 *               - 129  # TI-99
 *               - 130  # Nintendo Switch
 *               - 131  # Nintendo PlayStation
 *               - 132  # Amazon Fire TV
 *               - 133  # Philips Videopac G7000
 *               - 134  # Acorn Electron
 *               - 135  # Hyper Neo Geo 64
 *               - 136  # Neo Geo CD
 *               - 137  # New Nintendo 3DS
 *               - 138  # VC 4000
 *               - 139  # 1292 Advanced Programmable Video System
 *               - 140  # AY-3-8500
 *               - 141  # AY-3-8610
 *               - 142  # PC-50X Family
 *               - 143  # AY-3-8760
 *               - 144  # AY-3-8710
 *               - 145  # AY-3-8603
 *               - 146  # AY-3-8605
 *               - 147  # AY-3-8606
 *               - 148  # AY-3-8607
 *               - 149  # PC-98
 *               - 150  # TurboGrafx-16 / PC Engine CD
 *               - 151  # TRS-80 Color Computer
 *               - 152  # FM-7
 *               - 153  # Dragon 32/64
 *               - 154  # Amstrad PCW
 *               - 155  # Tatung Einstein
 *               - 156  # Thomson MO5
 *               - 157  # NEC PC-6000 Series
 *               - 158  # Commodore CDTV
 *               - 159  # Nintendo DSi
 *               - 160  # Nintendo eShop
 *               - 161  # Windows Mixed Reality
 *               - 162  # Oculus VR
 *               - 163  # SteamVR
 *               - 164  # Google Daydream
 *               - 165  # PlayStation VR
 *               - 166  # Pokémon mini
 *               - 167  # PlayStation 5
 *               - 169  # Xbox Series X|S
 *               - 170  # Google Stadia
 *               - 508  # Nintendo Switch 2
 *           default: []
 *         style: form
 *         explode: true
 *         required: false
 *         description: >
 *           Filter by platform ID (multiple allowed). Common: PC:6, PS4:48, PS5:167, Xbox One:49, Xbox Series:169, Switch:130
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter by release year (e.g. 2020)
 *       - in: query
 *         name: min_rating
 *         schema:
 *           type: number
 *           format: float
 *         required: false
 *         description: Minimum rating filter (e.g. 70)
 *       - in: query
 *         name: max_rating
 *         schema:
 *           type: number
 *           format: float
 *         required: false
 *         description: Maximum rating filter (e.g. 95)
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Missing query parameter "q"
 *       500:
 *         description: Failed to fetch games
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const genreParam = searchParams.getAll('genre_id') || []
    const platformParam = searchParams.getAll('platform_id') || []
    const genreIds = genreParam.map((g) => Number(g.trim())).filter(Boolean)
    const platformIds = platformParam.map((p) => Number(p.trim())).filter(Boolean)
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined
    const minRating = searchParams.get('min_rating') ? Number(searchParams.get('min_rating')) : undefined
    const maxRating = searchParams.get('max_rating') ? Number(searchParams.get('max_rating')) : undefined

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 })
    }

    // Log filters once
    console.log(`Query: ${query}`)
    console.log(`Genre IDs: ${genreIds.join(', ') || '(none)'}`)
    console.log(`Platform IDs: ${platformIds.join(', ') || '(none)'}`)
    console.log(`Year Filter: ${year || '(none)'}`)
    console.log(`Rating Range: min=${minRating ?? '(none)'} max=${maxRating ?? '(none)'}`)

    const queryNormalized = normalize(query)

    // --- Supabase search ---
    let results: Game[] = []
    try {
      const broadQuery = query.slice(0, 3)
      const { data, error } = await supabase
        .from('games')
        .select('id, name, summary, cover_url, first_release_date, genres, platforms, rating')
        .ilike('name', `%${broadQuery}%`)

      if (error) throw error

      const parsed = (data || []).map((g) => ({
        ...g,
        genres: typeof g.genres === 'string' ? JSON.parse(g.genres) : g.genres || [],
        platforms: typeof g.platforms === 'string' ? JSON.parse(g.platforms) : g.platforms || [],
        first_release_date: g.first_release_date
          ? new Date(
              g.first_release_date > 9999999999
                ? g.first_release_date
                : g.first_release_date * 1000
            ).toISOString().split('T')[0]
          : undefined,
      }))

      results = parsed.filter((g) => normalize(g.name).includes(queryNormalized))
      const { filteredGames } = filterByGenre(results, genreIds)
      results = filteredGames
      const { filteredGames: platformFiltered } = filterByPlatform(results, platformIds)
      results = platformFiltered
      const { filteredGames: yearFiltered } = filterByYear(results, year)
      results = yearFiltered
      const { filteredGames: ratingFiltered } = filterByRating(results, minRating, maxRating)
      results = ratingFiltered

      console.log(`[Supabase Results] (${results.length} found)`)
      console.log('[Supabase Game Names]: [\n  ' + results.map((g) => `'${g.name}'`).join(',\n  ') + '\n]')
    } catch (e) {
      console.error('Supabase query failed:', e)
    }

    console.log(`[Final Results]: ${results.length} games total`)
    console.log('[Game Names]: [\n  ' + results.map((g) => `'${g.name}'`).join(',\n  ') + '\n]')

    return NextResponse.json({
      results: results.map((g) => ({
        id: g.id,
        name: g.name,
        summary: g.summary,
        cover_url: g.cover_url,
        release_date: g.first_release_date,
        genres: g.genres,
        platforms: g.platforms,
        rating: g.rating ?? undefined,
      })),
      total: results.length,
    })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}
