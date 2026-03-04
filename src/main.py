import asyncio
import logging
import sys

from src.bot.run import run as async_run_bot


def main():
    asyncio.run(async_run_bot())


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    main()
