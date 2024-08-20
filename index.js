const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js')
const { createClient } = require('@sanity/client')
const axios = require('axios')

const tenorAPIKey = process.env.TENOR_API

const sanity = createClient({
  projectId: '4imfuif9',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2022-03-07'
})

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

async function fetchGifUrl(searchTerm) {
  try {
    const response = await axios.get(
      `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
        searchTerm
      )}&key=${tenorAPIKey}&limit=100`
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

async function getGif(message) {
  const groq = "*[_type == 'keywords'] { message_keywords, gif_search_phrase }"
  const keywords = await sanity.fetch(groq)
  console.log(keywords)
  for (const keyword of keywords) {
    for (const message_keyword of keyword.message_keywords) {
      if (message.toLowerCase().includes(message_keyword)) {
        return fetchGifUrl(keyword.gif_search_phrase)
      }
    }
  }
  return null
}

client.once('ready', () => {
  console.log('Bot is online!')
})

client.on('messageCreate', async (message) => {
  if (message.author.bot) return
  if (message.content.startsWith('@nohomo')) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply('You do not have permission to use this command.')
    }
    const messages = await message.channel.messages.fetch({ limit: 100 })
    const botMessages = messages.filter((msg) => msg.author.bot)
    botMessages.forEach(async (msg) => {
      try {
        await msg.delete()
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    })
    return message.reply('Bawal bakla dito. Tangina mo.')
  }
  const gifUrl = await getGif(message.content)
  if (gifUrl) {
    message.reply(gifUrl)
  } else {
    console.error('No GIF URL to send in response to the keyword.')
  }
})

const token = process.env.DISCORD_TOKEN
client.login(token)
