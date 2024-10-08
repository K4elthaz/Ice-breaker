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
    GatewayIntentBits.GuildMembers, // Needed to fetch server members
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
      return message.channel.send('You do not have permission to use this command.')
    }
  
    const messages = await message.channel.messages.fetch({ limit: 20 })
  
    const botMessages = messages.filter((msg) => msg.author.bot)
    botMessages.forEach(async (msg) => {
      try {
        await msg.delete()
      } catch (error) {
        console.error('Error deleting bot message:', error)
      }
    })
  
    const userMessages = messages.filter((msg) => !msg.author.bot)
    const keywords = await sanity.fetch("*[_type == 'keywords'] { message_keywords }")
    userMessages.forEach(async (msg) => {
      for (const keyword of keywords) {
        if (keyword.message_keywords.some((k) => msg.content.toLowerCase().includes(k))) {
          try {
            await msg.delete()
          } catch (error) {
            console.error('Error deleting user message:', error)
          }
        }
      }
    })
  
    try {
      await message.delete()
    } catch (error) {
      console.error('Error deleting the user\'s command message:', error)
    }
    console.log('Deleted messages complete!')
    return message.channel.send('Bawal bakla dito. Tangina mo.')
  }
  

  if (message.content.startsWith('@amigay?')) {
    const percentage = Math.floor(Math.random() * 101)
    return message.reply(`||You are ${percentage}% gay!! 🌈||`)
  }

  if (message.content.startsWith('@kamusta')) {
    const kamustaReplies = await sanity.fetch("*[_type == 'kamustaReply']");
    const roleId = '1220427702952005643';
    const members = await message.guild.members.fetch();

    const roleMembers = members.filter(member => 
      !member.user.bot && member.roles.cache.has(roleId)
    );

    if (roleMembers.size > 0) {
      const randomMember = roleMembers.random();
      const botMessage = await message.channel.send(`${randomMember}, kamusta ka naman?`);

      const filter = response => response.author.id === randomMember.id && !response.author.bot;
      const collector = message.channel.createMessageCollector({ filter, time: 15000 });

      collector.on('collect', (response) => {
        let foundReply = false;
        let randomBotReply;
      
        for (const reply of kamustaReplies) {
          if (reply.reply_content.some(keyword => response.content.toLowerCase().includes(keyword.toLowerCase()))) {
            randomBotReply = reply.bot_reply_message[Math.floor(Math.random() * reply.bot_reply_message.length)];
            foundReply = true;
            break;
          }
        }
      
        if (!foundReply) {
          const randomReplyIndex = Math.floor(Math.random() * kamustaReplies.length);
          randomBotReply = kamustaReplies[randomReplyIndex].bot_reply_message[
            Math.floor(Math.random() * kamustaReplies[randomReplyIndex].bot_reply_message.length)
          ];
        }
      
        response.reply(randomBotReply);
        collector.stop();
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          botMessage.reply('Bading ata siya di nag reply! 😢');
        }
      });
    } else {
      message.reply('No users found with the specified role!');
    }

    try {
      await message.delete();
    } catch (error) {
      console.error('Error deleting the user\'s command message:', error);
    }
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
