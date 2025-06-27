client.on('message_create', async (msg) => {
  try {
    // Ignore messages from the bot itself
    if (msg.fromMe) return;

    const chat = await msg.getChat();
    const contact = await msg.getContact();

    // Simple keyword-based auto reply (e.g., user says "hi", "hello", "hey")
    const text = msg.body.toLowerCase();

    if (["hi", "hello", "hey", "salam", "হাই"].some(greet => text.includes(greet))) {
      const hour = new Date().getHours();
      const timeGreeting = hour < 12 ? "Good morning!"
                        : hour < 17 ? "Good afternoon!"
                        : hour < 21 ? "Good evening!"
                        : "Good night!";

      const userName = contact.pushname || contact.name || "Friend";

      const greetings = [
        `${timeGreeting} ${userName}! 👋`,
        `Hey there, ${userName}! 😊`,
        `Hello ${userName}! Hope you're having a great day! ✨`,
        `Hi ${userName}! Nice to see you again! 🤗`,
        `Greetings, ${userName}! What brings you here today? 🎉`
      ];

      const reply = greetings[Math.floor(Math.random() * greetings.length)];
      await msg.reply(reply);
    }
    
    // Add more keywords or logic here for other auto replies

  } catch (error) {
    console.error("Auto reply error:", error);
  }
});
