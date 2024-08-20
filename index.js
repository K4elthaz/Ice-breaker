const { Client, GatewayIntentBits } = require('discord.js')
const axios = require('axios')

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

// Configuration
const tenorAPIKey = process.env.TENOR_API
const searchTerm = 'men kissing'
const keywords = [
  'bading',
  'arnold celis',
  'tarub',
  'gae',
  'anot',
  'gay',
  'fenris',
  'liempo',
  'nigga',
  'nigger',
  'satsu',
  'james',
  '@718481765811093536'
]

// Function to fetch a random GIF from Tenor
async function fetchRandomGif() {
  try {
    const response = await axios.get(
      `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
        searchTerm
      )}&key=${tenorAPIKey}&limit=20`
    )
    const gifs = response.data.results
    console.log('Fetched GIFs:', gifs)

    if (gifs.length > 0) {
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)].url
      return randomGif
    } else {
      console.error('No GIFs found for the search term.')
      return null
    }
  } catch (error) {
    console.error('Error fetching GIF from Tenor:', error)
    return null
  }
}

client.once('ready', () => {
  console.log('Bot is online!')
  const channel = client.channels.cache.get('1099699565826953236')
  if (!channel) {
    console.error('Channel not found!')
    return
  }
})

client.on('messageCreate', async (message) => {
  if (message.author.bot) return

  console.log('Message Received:', message.content)

  const foundKeyword = keywords.find((keyword) =>
    message.content.toLowerCase().includes(keyword)
  )

  if (foundKeyword) {
    console.log(`Keyword "${foundKeyword}" detected, fetching GIF...`)
    const gifUrl = await fetchRandomGif()
    if (gifUrl) {
      message.channel.send(gifUrl).catch((error) => {
        console.error('Error sending GIF:', error)
      })
    } else {
      console.error('No GIF URL to send in response to the keyword.')
    }
  }
})

const token = process.env.DISCORD_TOKEN
client.login(token)
