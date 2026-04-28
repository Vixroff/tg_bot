from __future__ import annotations

import os

from aiogram import Dispatcher
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)
from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert

from backend.database.engine import session_maker
from backend.database.models import User
from backend.services import orders as orders_service

dispatcher = Dispatcher()

MINI_APP_URL = os.getenv("MINI_APP_URL")
START_PHOTO_URL = os.getenv("START_PHOTO_URL")


def _shop_keyboard() -> InlineKeyboardMarkup | None:
    if not MINI_APP_URL:
        return None
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть магазин",
                    web_app=WebAppInfo(url=MINI_APP_URL),
                )
            ]
        ]
    )


@dispatcher.message(CommandStart())
async def command_start_handler(message: Message):
    async with session_maker.begin() as session:
        statement = (
            insert(User)
            .values(
                telegram_id=message.from_user.id,
                username=message.from_user.username,
                first_name=message.from_user.first_name,
                last_name=message.from_user.last_name,
            )
            .on_conflict_do_update(
                index_elements=["telegram_id"],
                set_={
                    "username": User.username,
                    "first_name": User.first_name,
                    "last_name": User.last_name,
                },
            )
            .returning(text("xmax = 0"))
        )
        result = await session.execute(statement)
        is_new_user = result.scalar_one()

    if is_new_user:
        first_name = message.from_user.first_name or message.from_user.username or "друг"
        text_message = (
            f"Привет, {first_name}!\n\n"
            "Добро пожаловать в рыбную лавку. Здесь можно посмотреть каталог, "
            "выбрать товар и оформить заказ прямо в Mini App."
        )
    else:
        text_message = "Магазин уже готов. Открой Mini App, чтобы посмотреть каталог и свои заказы."

    keyboard = _shop_keyboard()

    if is_new_user and START_PHOTO_URL:
        await message.answer_photo(photo=START_PHOTO_URL, caption=text_message, reply_markup=keyboard)
    elif keyboard:
        await message.answer(text=text_message, reply_markup=keyboard)
    else:
        await message.answer(text=text_message)


@dispatcher.message(Command("menu", "shop"))
async def command_menu_handler(message: Message):
    keyboard = _shop_keyboard()
    if not keyboard:
        await message.answer(text=("Mini App пока не настроено. Обратитесь к администратору бота."))
        return

    await message.answer(
        text="Открой Mini App, чтобы выбрать и заказать рыбу.",
        reply_markup=keyboard,
    )


@dispatcher.message(Command("orders"))
async def command_orders_handler(message: Message):
    async with session_maker() as session:
        result = await session.execute(select(User).where(User.telegram_id == message.from_user.id))
        user = result.scalar_one_or_none()

        if user is None:
            await message.answer(text=("Я тебя еще не знаю. Напиши /start, а потом сделай заказ."))
            return

        orders = await orders_service.list_orders_for_user(session, user)

    if not orders:
        await message.answer(text="У тебя пока нет заказов.")
        return

    lines: list[str] = []
    for order in orders[:5]:
        status = order.get("status", "unknown")
        total = order.get("total_amount", 0)
        created_at = order.get("created_at") or "-"
        lines.append(f"#{order['id']}: {total} ₽, статус: {status}, создан: {created_at}")

    text_lines = ["Твои последние заказы:", *lines]
    await message.answer(text="\n".join(text_lines))
