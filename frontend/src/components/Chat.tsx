import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import BaseUrl from '../utils/BaseUrl';
import { getCurrentUserInfo } from "../utils/getCurrentUserInfo";

interface User {
	id: string;
	username: string;
	email?: string;
}

function Chat() {
	const { id: recipient_id } = useParams<{ id: string }>();
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState<any[]>([]);
	const ws = useRef<WebSocket | null>(null);
	const [recipientUser, setRecipientUser] = useState<User | null>(null);
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
	const [editingContent, setEditingContent] = useState('');
	const [thisUserInfo, setThisUserInfo] = useState<User | null>(null);

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) return;

		const initWebSocket = () => {
			ws.current = new WebSocket(`ws://localhost:8000/ws/?token=${token}`);

			ws.current.onopen = () => {
				console.log('WebSocket connected');
			};

			ws.current.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (data.type === 'new_message' || data.type === 'sent') {
					setMessages(prev => [...prev, data]);
				}
			};

			ws.current.onclose = () => {
				console.log('WebSocket disconnected');
			};
		}

		const fetchHistory = async () => {
			const res = await fetch(`${BaseUrl}messages/${recipient_id}`, {
				headers: {
				"Authorization": `Bearer ${token}`
				}
			});
			const data = await res.json();
			setMessages(data);
			console.log(data)
		};

		const fetchRecipientUser = async () => {
			const res = await fetch(`${BaseUrl}users/${recipient_id}`, {
				headers: { "Authorization": `Bearer ${token}` }
			});
			const data = await res.json();
			setRecipientUser(data);
		};

		const fetchThisUser = async () => {
			const user = await getCurrentUserInfo();
			if (user) setThisUserInfo(user);
		};

		initWebSocket();
		fetchThisUser();
		fetchHistory();
		fetchRecipientUser();

		return () => {
			ws.current?.close();
		};
	}, [recipient_id]);

	const handleSend = () => {
		if (!message || !ws.current) return;

		ws.current.send(JSON.stringify({
			recipient_id: recipient_id,
			content: message
		}));

		setMessage('');
	};

	const handleDelete = async (msgId: string) => {
		const token = localStorage.getItem("token");
		await fetch(`${BaseUrl}messages/${msgId}`, {
			method: "DELETE",
			headers: { "Authorization": `Bearer ${token}` }
		});

		setMessages(prev => prev.filter(msg => msg.id !== msgId));
	};

	const handleEdit = (msgId: string, currentContent: string) => {
		setEditingMessageId(msgId);
		setEditingContent(currentContent);
	};

	const handleConfirmEdit = async (msgId: string) => {
		const token = localStorage.getItem("token");
		if (!token) return;

		await fetch(`${BaseUrl}messages/${msgId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
			},
			body: JSON.stringify({ content: editingContent })
		});

		setMessages(prev =>
			prev.map(msg => msg.id === msgId ? { ...msg, content: editingContent } : msg)
		);

		setEditingMessageId(null);
		setEditingContent('');
	};

	const handleCancelEdit = () => {
		setEditingMessageId(null);
		setEditingContent('');
	};

  return (
    <div>
      <h2>Chat with {recipientUser?.username || "..."}</h2>
      <div>
        {messages.map((msg, idx) => (
          <div key={msg.id}>
            <strong>{msg.sender_id === recipient_id ? recipientUser?.username : thisUserInfo?.username}:</strong> {msg.content}
            {editingMessageId === msg.id ? (
        <>
          <input
            type="text"
            value={editingContent}
            onChange={e => setEditingContent(e.target.value)}
          />
          <button onClick={() => handleConfirmEdit(msg.id)}>Save</button>
          <button onClick={handleCancelEdit}>Cancel</button>
        </>
      ) : (
        <>
          {msg.sender_id !== recipient_id && (
            <>
              <button onClick={() => handleEdit(msg.id, msg.content)}>Edit</button>
              <button onClick={() => handleDelete(msg.id)}>Delete</button>
            </>
          )}
        </>
      )}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Send your message"
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default Chat;