import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import BaseUrl from '../utils/BaseUrl';
import { getCurrentUserInfo } from "../utils/getCurrentUserInfo";

interface User {
	id: string;
	username: string;
	email?: string;
}

interface Message {
	id: string;
	sender_id: string;
	recipient_id: string;
	content: string;
	attachments?: { filename: string; url: string }[];
	created_at: string;
	updated_at?: string;
	type?: string;
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
	const [files, setFiles] = useState<File[]>([]);

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
			if (!res.ok) {
				console.error("Failed to fetch messages:", res.statusText);
				setMessages([]);
				return;
			}
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

	const handleSend = async () => {
		if (!message || !ws.current) return;

		const token = localStorage.getItem("token");
		if (!token) return;

		if (files.length > 0) {
			const formData = new FormData();
			files.forEach(file => formData.append("files", file));
			if (message) formData.append("content", message);
			formData.append("recipient_id", recipient_id!);

			const res = await fetch(`${BaseUrl}messages/send/`, {
				method: "POST",
				headers: { "Authorization": `Bearer ${token}` },
				body: formData
			});
			const data = await res.json();
			setMessages(prev => [...prev, data]);
			setMessage('');
			setFiles([]);
		} else {
			ws.current?.send(JSON.stringify({ recipient_id, content: message }));
			setMessage('');
		}
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

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = e.target.files;
		if (selectedFiles) {
			setFiles(prev => [...prev, ...Array.from(selectedFiles)]);
		}
	};

  return (
    <div>
      <h2>Chat with {recipientUser?.username || "..."}</h2>
      <div>
        {messages.map((msg, idx) => (
          <div key={msg.id}>
            <strong>{msg.sender_id === recipient_id ? recipientUser?.username : thisUserInfo?.username}:</strong> {msg.content}
            
			{msg.attachments?.map((att: { filename: string; url: string }) => (
				<div key={att.url}>
					<a href={att.url} target="_blank" rel="noopener noreferrer">{att.filename}</a>
				</div>
			))}

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
      <input
		type="file"
		multiple
		onChange={handleFileChange}
		className="hidden"
		id="file-input"
		/>
	  <label htmlFor="file-input">
		Select files
	  </label>
	  <div>
		{files.map((file, index) => (
			<div key={index}>
			{file.name}{" "}
			<button onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}>Remove</button>
			</div>
		))}
	  </div>

      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default Chat;