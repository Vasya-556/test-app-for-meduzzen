import React from 'react'
import { useParams } from 'react-router-dom';

function Chat() {
    const { id } = useParams<{ id: string }>();

  return (
    <div>
      <input
          type="text"
          name="message"
          placeholder="sen your message"
        />
        <button>send</button>
    </div>
  )
}

export default Chat