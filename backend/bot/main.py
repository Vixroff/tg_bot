import asyncio
import logging
import os
import sys

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from .commands import dispatcher

TOKEN = os.getenv("TOKEN")


async def run():
    bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    try:
        await dispatcher.start_polling(bot)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    asyncio.run(run())
