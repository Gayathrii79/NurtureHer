from fastapi import APIRouter

from app.api import admin, asha, auth, caregiver, chatbot, cycle, notifications, pcos, ppd, wellness

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(wellness.router)
api_router.include_router(cycle.router)
api_router.include_router(pcos.router)
api_router.include_router(ppd.router)
api_router.include_router(chatbot.router)
api_router.include_router(caregiver.router)
api_router.include_router(asha.router)
api_router.include_router(admin.router)
api_router.include_router(notifications.router)
