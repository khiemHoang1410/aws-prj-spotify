import { formatDistanceToNow } from "date-fns"

const ChatBubble = ({ message, timestamp }) => {
  const isUser = message.role === "user"

  return (
    <div className={`flex w-full mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${isUser ? "bg-primary text-white" : "bg-gray-200 text-gray-800"}`}
      >
        <p className="text-sm">{message.content}</p>
        <p className="text-xs mt-1 opacity-70">{formatDistanceToNow(timestamp, { addSuffix: true })}</p>
      </div>
    </div>
  )
}

export default ChatBubble
