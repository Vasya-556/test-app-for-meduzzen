import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
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
    <div className="max-w-lg mx-auto mt-6 p-4 bg-white shadow-md rounded-md">
      <h2 className="text-xl font-semibold mb-4">Chat with {recipientUser?.username || "..."}</h2>
      <div className="space-y-3 mb-4">
        {messages.map((msg, idx) => (
          <div key={msg.id} className="p-2 border rounded">
            <strong>{msg.sender_id === recipient_id ? recipientUser?.username : thisUserInfo?.username}:</strong> {msg.content}
            
			{msg.attachments?.map((att: { filename: string; url: string }) => (
				<div key={att.url}>
					<a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{att.filename}</a>
				</div>
			))}

			{editingMessageId === msg.id ? (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={editingContent}
            onChange={e => setEditingContent(e.target.value)}
			className="border p-1 rounded flex-1"
          />
          <button onClick={() => handleConfirmEdit(msg.id)} className="bg-blue-500 text-white px-2 rounded">Save</button>
          <button onClick={handleCancelEdit} className="bg-gray-300 px-2 rounded">Cancel</button>
        </div>
      ) : (
        <>
          {msg.sender_id !== recipient_id && (
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleEdit(msg.id, msg.content)} className="bg-yellow-400 px-2 rounded">Edit</button>
              <button onClick={() => handleDelete(msg.id)} className="bg-red-400 px-2 rounded">Delete</button>
            </div>
          )}
        </>
      )}
          </div>
        ))}
      </div>
	  <div className="flex flex-col gap-2">
		<input
			type="text"
			value={message}
			onChange={e => setMessage(e.target.value)}
			placeholder="Send your message"
		    className="border p-2 rounded w-full"
		/>
		<input
			type="file"
			multiple
			onChange={handleFileChange}
			className="hidden"
			id="file-input"
			/>
		<label htmlFor="file-input" className="cursor-pointer text-blue-500 hover:underline">
			Select files
		</label>
		<div className="space-y-1">
			{files.map((file, index) => (
				<div key={index} className="flex justify-between items-center border p-1 rounded">
				{file.name}{" "}
				<button onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))} className="text-red-500">Remove</button>
				</div>
			))}
		</div>

		<button onClick={handleSend} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Send</button>
	  </div>
    </div>
  );
}

export default Chat;