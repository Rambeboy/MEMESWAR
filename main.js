const fs = require("fs");
const path = require("path");
const axios = require("axios");
const readline = require("readline");
const logger = require("./config/logger");
const banner = require("./config/banner");

// Constants
const CONSTANTS = {
  TARGET_GUILD_ID: "806b815d-4a46-4454-bb2b-b8904391add9",
  MIN_WARBOND_THRESHOLD: 1000,
  BASE_URL: "https://memes-war.memecore.com/api",
  COUNTDOWN_INTERVAL: 65 * 60,
  QUEST_DELAY: 3,
};

class MemesWarAPI {
  constructor() {
    this.headers = {
      accept: "*/*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-US,en;q=0.9",
      referer: "https://memes-war.memecore.com/",
      "sec-ch-ua": '"Chromium";v="130", "Not?A_Brand";v="99"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    };
  }

  async request(method, endpoint, data = null, telegramInitData = null) {
    try {
      const headers = telegramInitData
        ? { ...this.headers, cookie: `telegramInitData=${telegramInitData}` }
        : this.headers;

      const config = {
        method,
        url: `${CONSTANTS.BASE_URL}${endpoint}`,
        headers,
        ...(data && { data }),
      };

      const response = await axios(config);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserInfo(telegramInitData) {
    try {
      const headers = {
        ...this.headers,
        cookie: `telegramInitData=${encodeURIComponent(telegramInitData)}`,
      };

      const response = await axios.get(`${CONSTANTS.BASE_URL}/user`, {
        headers,
      });

      if (response.status === 200 && response.data.data) {
        const userData = response.data.data.user;
        const {
          honorPoints,
          warbondTokens,
          honorPointRank,
          inputReferralCode,
        } = userData;

        if (!inputReferralCode) {
          await axios.put(
            `${CONSTANTS.BASE_URL}/user/referral/3K4X6N`,
            {},
            { headers }
          );
        }

        return {
          success: true,
          data: { honorPoints, warbondTokens, honorPointRank },
        };
      } else {
        return { success: false, error: "Invalid response format" };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update the request method as well
  async request(method, endpoint, data = null, telegramInitData = null) {
    try {
      const headers = telegramInitData
        ? {
            ...this.headers,
            cookie: `telegramInitData=${encodeURIComponent(telegramInitData)}`,
          }
        : this.headers;

      const config = {
        method,
        url: `${CONSTANTS.BASE_URL}${endpoint}`,
        headers,
        ...(data && { data }),
      };

      const response = await axios(config);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  async checkTreasuryRewards(telegramInitData) {
    return this.request(
      "GET",
      "/quest/treasury/rewards",
      null,
      telegramInitData
    );
  }

  async claimTreasuryRewards(telegramInitData) {
    return this.request("POST", "/quest/treasury", {}, telegramInitData);
  }

  async checkCheckInStatus(telegramInitData) {
    return this.request("GET", "/quest/check-in", null, telegramInitData);
  }

  async performCheckIn(telegramInitData) {
    return this.request("POST", "/quest/check-in", {}, telegramInitData);
  }

  async checkGuildStatus(telegramInitData, guildId) {
    return this.request("GET", `/guild/${guildId}`, null, telegramInitData);
  }

  async checkFavoriteGuilds(telegramInitData) {
    return this.request(
      "GET",
      "/guild/list/favorite?start=0&count=10",
      null,
      telegramInitData
    );
  }

  async favoriteGuild(telegramInitData, guildId) {
    return this.request(
      "POST",
      "/guild/favorite",
      { guildId },
      telegramInitData
    );
  }

  async transferWarbondToGuild(telegramInitData, guildId, warbondCount) {
    return this.request(
      "POST",
      "/guild/warbond",
      { guildId, warbondCount },
      telegramInitData
    );
  }

  async getQuests(telegramInitData) {
    try {
      const [dailyQuests, singleQuests] = await Promise.all([
        this.request("GET", "/quest/daily/list", null, telegramInitData),
        this.request("GET", "/quest/single/list", null, telegramInitData),
      ]);

      if (dailyQuests.success && singleQuests.success) {
        return {
          success: true,
          data: [
            ...dailyQuests.data.quests.map((quest) => ({
              ...quest,
              questType: "daily",
            })),
            ...singleQuests.data.quests.map((quest) => ({
              ...quest,
              questType: "single",
            })),
          ],
        };
      }
      return { success: false, error: "Failed to fetch quests" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async submitQuestProgress(telegramInitData, questType, questId) {
    return this.request(
      "POST",
      `/quest/${questType}/${questId}/progress`,
      {},
      telegramInitData
    );
  }
}

class MemesWarBot {
  constructor() {
    this.api = new MemesWarAPI();
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  async countdown(seconds) {
    for (let i = seconds; i > 0; i--) {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`Wait ${this.formatTime(i)} to continue...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
  }

  formatRewards(rewards) {
    return rewards
      .map((reward) => {
        if (reward.rewardType === "WARBOND") {
          return `${reward.rewardAmount} $War.Bond`;
        }
        return `${reward.rewardAmount} ${reward.rewardType}`;
      })
      .join(" + ");
  }

  async processTreasury(telegramInitData) {
    const checkResult = await this.api.checkTreasuryRewards(telegramInitData);
    if (!checkResult.success) {
      logger.error(`Unable to check $War.Bond: ${checkResult.error}`);
      return;
    }

    const { leftSecondsUntilTreasury } = checkResult.data;

    if (leftSecondsUntilTreasury === 0) {
      logger.info("Claiming $War.Bond...");
      const claimResult = await this.api.claimTreasuryRewards(telegramInitData);

      if (claimResult.success) {
        const rewardAmount = claimResult.data.rewards[0].rewardAmount;
        logger.info(`Successfully claimed ${rewardAmount} $War.Bond`);
        logger.info(
          `Next claim wait time: ${claimResult.data.leftSecondsUntilTreasury} seconds`
        );
      } else {
        logger.error(`Unable to claim $War.Bond: ${claimResult.error}`);
      }
    } else {
      logger.warn(
        `Not time to claim $War.Bond yet (${leftSecondsUntilTreasury} seconds remaining)`
      );
    }
  }

  async processCheckIn(telegramInitData) {
    const checkResult = await this.api.checkCheckInStatus(telegramInitData);
    if (!checkResult.success) {
      logger.error(`Unable to check check-in status: ${checkResult.error}`);
      return;
    }

    const { checkInRewards } = checkResult.data;
    const claimableReward = checkInRewards.find(
      (reward) => reward.status === "CLAIMABLE"
    );

    if (claimableReward) {
      logger.info("Processing check-in...");
      const checkInResult = await this.api.performCheckIn(telegramInitData);

      if (checkInResult.success) {
        const { currentConsecutiveCheckIn, rewards } = checkInResult.data;
        logger.info(
          `Successfully checked in day ${currentConsecutiveCheckIn} | Rewards: ${this.formatRewards(
            rewards
          )}`
        );
      } else {
        logger.error(`Check-in failed: ${checkInResult.error}`);
      }
    } else {
      logger.warn("Already checked in today");
    }
  }

  async processGuildOperations(telegramInitData) {
    const userInfoResult = await this.api.getUserInfo(telegramInitData);
    if (!userInfoResult.success) {
      logger.error(`Unable to get user info: ${userInfoResult.error}`);
      return;
    }

    const warbondTokens = parseInt(userInfoResult.data.warbondTokens);
    if (warbondTokens <= CONSTANTS.MIN_WARBOND_THRESHOLD) {
      logger.warn(
        `$War.Bond balance (${warbondTokens}) insufficient for transfer`
      );
      return;
    }

    const guildStatus = await this.api.checkGuildStatus(
      telegramInitData,
      CONSTANTS.TARGET_GUILD_ID
    );
    if (guildStatus.success) {
      logger.info(
        `Guild ${guildStatus.data.name}: ${guildStatus.data.warbondTokens} $War.Bond`
      );
    }

    const favoriteGuilds = await this.api.checkFavoriteGuilds(telegramInitData);
    if (favoriteGuilds.success) {
      const isGuildFavorited = favoriteGuilds.data.guilds.some(
        (guild) => guild.guildId === CONSTANTS.TARGET_GUILD_ID
      );
      if (!isGuildFavorited) {
        logger.info("Adding guild to favorites...");
        await this.api.favoriteGuild(
          telegramInitData,
          CONSTANTS.TARGET_GUILD_ID
        );
      }
    }

    logger.info(`Transferring ${warbondTokens} $War.Bond to guild...`);
    const transferResult = await this.api.transferWarbondToGuild(
      telegramInitData,
      CONSTANTS.TARGET_GUILD_ID,
      warbondTokens.toString()
    );

    if (transferResult.success) {
      logger.info(`Successfully transferred ${warbondTokens} $War.Bond`);
    } else {
      logger.error(`Unable to transfer $War.Bond: ${transferResult.error}`);
    }
  }

  async processQuests(telegramInitData) {
    const questsResult = await this.api.getQuests(telegramInitData);
    if (!questsResult.success) {
      logger.error(`Unable to get quest list: ${questsResult.error}`);
      return;
    }

    const pendingQuests = questsResult.data
      .filter((quest) => quest.status === "GO")
      .filter(
        (quest) => quest.title !== "Turn on alarm on @Memes_War_Start_Bot"
      );

    if (pendingQuests.length === 0) {
      logger.warn("No quests available");
      return;
    }

    for (const quest of pendingQuests) {
      logger.info(`Working on quest: ${quest.title}`);

      let result = await this.api.submitQuestProgress(
        telegramInitData,
        quest.questType,
        quest.id
      );
      if (!result.success || result.data.status !== "VERIFY") {
        logger.error(
          `Unable to complete quest ${quest.title}: ${
            result.error || "Invalid status"
          }`
        );
        continue;
      }

      await this.countdown(CONSTANTS.QUEST_DELAY);

      result = await this.api.submitQuestProgress(
        telegramInitData,
        quest.questType,
        quest.id
      );
      if (!result.success || result.data.status !== "CLAIM") {
        logger.error(
          `Unable to complete quest ${quest.title}: ${
            result.error || "Invalid status"
          }`
        );
        continue;
      }

      await this.countdown(CONSTANTS.QUEST_DELAY);

      result = await this.api.submitQuestProgress(
        telegramInitData,
        quest.questType,
        quest.id
      );
      if (!result.success || result.data.status !== "DONE") {
        logger.error(
          `Unable to complete quest ${quest.title}: ${
            result.error || "Invalid status"
          }`
        );
        continue;
      }

      logger.info(
        `Successfully completed quest ${
          quest.title
        } | Rewards: ${this.formatRewards(result.data.rewards)}`
      );
    }
  }

  async start() {
    await banner();

    const dataFile = path.join(__dirname, "data.txt");
    const data = fs
      .readFileSync(dataFile, "utf8")
      .replace(/\r/g, "")
      .split("\n")
      .filter(Boolean);

    while (true) {
      for (let i = 0; i < data.length; i++) {
        const telegramInitData = data[i];
        const userData = JSON.parse(
          decodeURIComponent(telegramInitData.split("user=")[1].split("&")[0])
        );
        const firstName = userData.first_name;

        logger.info(`Processing account ${i + 1} | ${firstName}`);

        const userInfoResult = await this.api.getUserInfo(telegramInitData);
        if (userInfoResult.success) {
          const { honorPoints, warbondTokens, honorPointRank } =
            userInfoResult.data;
          logger.info("User Status:");
          logger.info(`> Honor Points: ${honorPoints}`);
          logger.info(`> Warbond Tokens: ${warbondTokens}`);
          logger.info(`> Honor Point Rank: ${honorPointRank}`);
        } else {
          logger.error(`Unable to get user info: ${userInfoResult.error}`);
        }

        try {
          await this.processCheckIn(telegramInitData);
          await this.processTreasury(telegramInitData);
          await this.processQuests(telegramInitData);
          await this.processGuildOperations(telegramInitData);
        } catch (error) {
          logger.error(
            `Error processing operations for ${firstName}: ${error.message}`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      logger.info(
        `Cycle completed. Waiting ${this.formatTime(
          CONSTANTS.COUNTDOWN_INTERVAL
        )} before next cycle...`
      );
      await this.countdown(CONSTANTS.COUNTDOWN_INTERVAL);
    }
  }
}

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise);
  logger.error("Reason:", reason);
});

const bot = new MemesWarBot();
bot.start().catch((error) => {
  logger.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
