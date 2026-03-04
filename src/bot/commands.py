from aiogram import Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import Message

from src.database.engine import session_maker
from src.database.models import User

dispatcher = Dispatcher()


@dispatcher.message(CommandStart())
async def command_start_handler(message: Message):
    async with session_maker.begin() as session:
        user = User(
            telegram_id=message.from_user.id,
            username=message.from_user.username,
            first_name=message.from_user.first_name,
            last_name=message.from_user.last_name,
        )
        session.add(user)

    await message.answer(text=f"hello {user.first_name}")
