import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message, Users
from .serializers import MessageSerializer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.group_name = f'chat_{self.user_id}'

        # Thêm vào group để nhận tin nhắn
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Rời group khi ngắt kết nối
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_text = data['text']
        receiver_id = data['receiver_id']
        sender_id = data['sender_id']

        # Lưu tin nhắn vào cơ sở dữ liệu
        message = await self.save_message(sender_id, receiver_id, message_text)

        # Gửi tin nhắn đến cả người gửi và người nhận
        await self.channel_layer.group_send(
            f'chat_{sender_id}',
            {'type': 'chat_message', 'message': message}
        )
        await self.channel_layer.group_send(
            f'chat_{receiver_id}',
            {'type': 'chat_message', 'message': message}
        )

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({'message': message}))

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, text):
        sender = Users.objects.get(user_id=sender_id)
        receiver = Users.objects.get(user_id=receiver_id)
        message = Message.objects.create(
            sender=sender,
            receiver=receiver,
            text=text,
            is_read=False
        )
        serializer = MessageSerializer(message)
        return serializer.data