process.loadEnvFile('.env');
import TelegramBot from 'node-telegram-bot-api';
import * as fs from 'fs';

const token = process.env.BOT_TOKEN!
const bot = new TelegramBot(token, { polling: true });

const apiUrl = 'https://api.pinksale.finance/api/v1/degen/list-pools?page=1&limit=20&chainId=501424';

let data: { users: number[], notifiedPools: string[] } = { users: [], notifiedPools: [] };

const loadData = () => {
    try {
        const rawData = fs.readFileSync('data.json', 'utf8');
        data = JSON.parse(rawData);
    } catch (error) {
        console.error('Error reading data.json:', error);
    }
};

const saveData = () => {
    try {
        fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data.json:', error);
    }
};

loadData();

const fetchPools = async () => {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.docs;
  } catch (error) {
    console.error('Error fetching data from API:', error);
    return [];
  }
};

const notifyUsers = async (newPools: any[]) => {
  for (const pool of newPools) {
    if (!data.notifiedPools.includes(pool.id)) {
      const message = `New DEGEN!\n\nName: ${pool.tokenData.name}\nURL: https://www.pinksale.finance/solana/degen/${pool.token}`;
      for (const userId of data.users) {
        await bot.sendMessage(userId, message);
      }
      data.notifiedPools.push(pool.id);
    }
  }
  saveData();
};

bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id;
  if (!data.users.includes(chatId)) {
    data.users.push(chatId);
    saveData();
  }
  bot.sendMessage(chatId, 'You will be notified about new pools.');
});

setInterval(async () => {
  const pools = await fetchPools();
  await notifyUsers(pools);
}, 10000);

console.log('Bot is running...');