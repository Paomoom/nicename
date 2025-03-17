import os
import json
import asyncio
import aiohttp
import gradio as gr
from typing import Dict, List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

COZE_API_KEY = os.getenv('COZE_API_KEY')
COZE_BOT_ID = os.getenv('COZE_BOT_ID')
COZE_USER_ID = os.getenv('COZE_USER_ID')
COZE_BASE_URL = 'https://api.coze.cn'

class Message(BaseModel):
    role: str
    content: str

class ChatHistory(BaseModel):
    messages: List[Message] = []

class AIAssistant:
    def __init__(self, name: str, description: str, is_coze: bool = False):
        self.name = name
        self.description = description
        self.history = ChatHistory()
        self.is_coze = is_coze
        self.conversation_id: Optional[str] = None
        
    async def create_coze_conversation(self) -> bool:
        if not self.is_coze or not COZE_API_KEY:
            return False
            
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {COZE_API_KEY}',
                'Content-Type': 'application/json'
            }
            try:
                async with session.post(
                    f'{COZE_BASE_URL}/v1/conversation/create',
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('code') == 0 and data.get('data', {}).get('id'):
                            self.conversation_id = data['data']['id']
                            return True
            except Exception as e:
                print(f'创建Coze会话失败: {str(e)}')
            return False
            
    async def send_message_to_coze(self, message: str, cancel_flag: bool = False):
        # 发送消息到Coze API的异步方法
        # 参数:
        #   message: 用户发送的消息内容
        #   cancel_flag: 终止标志
        # 返回:
        #   异步生成器，逐步返回AI助手的响应内容
        
        # 验证必要的配置是否完整
        if not self.is_coze or not self.conversation_id or not COZE_API_KEY:
            yield f'[{self.name}] Coze配置错误'
            return
            
        # 设置API请求头
        headers = {
            'Authorization': f'Bearer {COZE_API_KEY}',  # 设置认证Token
            'Content-Type': 'application/json'  # 设置内容类型为JSON
        }
        
        # 构建请求体数据
        payload = {
            'bot_id': COZE_BOT_ID,  # 设置机器人ID
            'user_id': COZE_USER_ID,  # 设置用户ID
            'stream': True,  # 启用流式响应
            'auto_save_history': True,  # 自动保存对话历史
            'additional_messages': [  # 添加用户消息
                {
                    'role': 'user',  # 消息角色为用户
                    'content': message,  # 消息内容
                    'content_type': 'text'  # 消息类型为文本
                }
            ]
        }
        
        try:
            # 创建HTTP会话
            async with aiohttp.ClientSession() as session:
                # 发送POST请求到Coze API
                async with session.post(
                    f'{COZE_BASE_URL}/v3/chat?conversation_id={self.conversation_id}',
                    headers=headers,
                    json=payload
                ) as response:
                    # 检查响应状态码
                    if response.status != 200:
                        yield f'[{self.name}] 请求失败: {response.status}'
                        return
                    
                    # 用于累积响应内容的变量
                    current_response = ''
                    
                    # 逐行处理流式响应数据
                    async for line in response.content:
                        # 检查终止标志
                        if cancel_flag:
                            return
                            
                        # 解码并清理每一行数据
                        line = line.decode('utf-8').strip()
                        # 跳过空行
                        if not line:
                            continue
                            
                        # 解析事件和数据
                        if line.startswith('event:'):
                            event_type = line[6:].strip()
                            continue
                            
                        if line.startswith('data:'):
                            try:
                                # 解析JSON数据
                                data = json.loads(line[5:])
                                
                                # 处理[DONE]标记
                                if data == '[DONE]':
                                    break
                                    
                                # 只处理conversation.message.delta事件中的answer类型消息
                                if (event_type == 'conversation.message.delta' and
                                    isinstance(data, dict) and
                                    data.get('type') == 'answer'):
                                    # 提取响应内容
                                    content = data.get('content')
                                    if content and content.strip():
                                        # 格式化内容
                                        content = content.strip()
                                        # 确保编号标题前有双换行
                                        if content.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.')):
                                            content = '\n\n' + content
                                        # 在段落之间添加适当的间距
                                        if content.endswith('。') or content.endswith('：'):
                                            content += '\n'
                                        # 添加到当前响应并保持markdown格式
                                        current_response += content
                                        yield current_response
                                        
                            except (json.JSONDecodeError, IndexError, KeyError):
                                # 忽略JSON解析错误和其他数据处理异常
                                continue
                    
                    # 如果整个过程中没有收到任何有效响应，返回提示信息
                    if not current_response.strip():
                        yield f'[{self.name}] 无响应内容'
                    
        except Exception as e:
            # 处理网络请求等其他异常
            yield f'[{self.name}] 发送消息失败: {str(e)}'

    async def chat(self, message: str, history: List[List[str]], cancel_flag: bool = False) -> str:
        # 立即添加用户消息
        history.append([message, ""])
        
        response = ""
        if self.is_coze:
            if not self.conversation_id:
                if not await self.create_coze_conversation():
                    history[-1][1] = f'[{self.name}] 创建会话失败'
                    yield history
                    return
            async for partial_response in self.send_message_to_coze(message, cancel_flag):
                response = partial_response  # 更新最终响应
                history[-1][1] = response
                yield history
        else:
            response = f'[{self.name}] 收到消息: {message}'
            history[-1][1] = response
            yield history
            
        # 只有在没有被终止的情况下才保存历史记录
        if not history[-1][1].endswith("[已终止]"):
            self.history.messages.append(Message(role='user', content=message))
            self.history.messages.append(Message(role='assistant', content=response))
            
            # 保存回复到answer.json
            answer_data = {
                "conversation": {
                    "messages": [
                        {"role": msg.role, "content": msg.content}
                        for msg in self.history.messages
                    ],
                    "metadata": {
                        "conversation_id": self.conversation_id,
                        "assistant_name": self.name,
                        "created_at": None,
                        "updated_at": None
                    }
                },
                "settings": {
                    "is_coze": self.is_coze,
                    "auto_save": True
                }
            }
            with open('answer.json', 'w', encoding='utf-8') as f:
                json.dump(answer_data, f, ensure_ascii=False, indent=4)

class ChatApp:
    def __init__(self):
        self.assistants: Dict[str, AIAssistant] = {}
        self._init_assistants()

    def _init_assistants(self):
        # 初始化AI助手列表
        self.assistants["Coze智能体1"] = AIAssistant("Coze智能体1", "Coze平台的AI助手", is_coze=True)

    def create_interface(self):
        with gr.Blocks(title="AI助手对话系统") as interface:
            gr.Markdown("# AI助手对话系统")
            
            with gr.Row():
                with gr.Column(scale=4):
                    chatbot = gr.Chatbot(
                        height=600,
                        bubble_full_width=False,
                        show_label=False,
                        render_markdown=True,
                        line_breaks=True,  # 启用换行符支持
                        latex_delimiters=[]  # 禁用LaTeX渲染以避免干扰markdown渲染
                    )
                    with gr.Row():
                        msg = gr.Textbox(
                            placeholder="在这里输入您的消息...",
                            container=False,
                            scale=8
                        )
                        submit_btn = gr.Button("发送", scale=1)
                        stop_btn = gr.Button("终止", scale=1)
                
                with gr.Column(scale=1):
                    assistant_radio = gr.Radio(
                        choices=list(self.assistants.keys()),
                        value=list(self.assistants.keys())[0],
                        label="选择AI助手"
                    )

            # 添加取消标志
            cancel_flag = gr.State(False)

            async def chat(message: str, history: List[List[str]], assistant_name: str, cancel_flag: bool):
                if not message:
                    yield history, "", False
                
                assistant = self.assistants[assistant_name]
                history.append([message, ""])  # 添加用户消息和空的助手回复
                
                async for updated_history in assistant.chat(message, history):
                    if cancel_flag:
                        history[-1][1] += "\n[已终止]"  # 添加终止标记
                        yield history, "", False
                        return
                    yield updated_history, "", False
                
                yield history, "", False

            def set_cancel_flag():
                return True

            submit_btn.click(
                chat,
                inputs=[msg, chatbot, assistant_radio, cancel_flag],
                outputs=[chatbot, msg, cancel_flag],
                api_name=False
            )

            msg.submit(
                chat,
                inputs=[msg, chatbot, assistant_radio, cancel_flag],
                outputs=[chatbot, msg, cancel_flag],
                api_name=False
            )

            stop_btn.click(
                set_cancel_flag,
                outputs=cancel_flag,
                api_name=False
            )

        return interface

def main():
    app = ChatApp()
    interface = app.create_interface()
    interface.launch(server_name="127.0.0.1", server_port=7860, share=True)

if __name__ == "__main__":
    main()