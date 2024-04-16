async function loadDataFromGoogleDocs(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    const htmlData = await response.text();
    if (!htmlData) {
      throw new Error('Empty HTML data');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlData, 'text/html');

    const topics = doc.querySelectorAll('h1');
    const topicData = {};

    topics.forEach(topic => {
      const topicName = topic.textContent.trim();
      topicData[topicName] = [];
      let currentMessageTitle = '';
      let currentMessageContent = '';

      let currentNode = topic.nextElementSibling;
      while (currentNode) {
        if (currentNode.tagName === 'H1') {
          break; // Next topic encountered, exit loop
        } else if (currentNode.tagName === 'H2') {
          if (currentMessageTitle && currentMessageContent) {
            topicData[topicName].push({ messageTitle: currentMessageTitle, messageContent: currentMessageContent });
          }
          currentMessageTitle = currentNode.textContent.trim().replace(/^\s*\d+(?:\.\d+)?[\s.]+\s*/, ''); // Update here
          currentMessageContent = '';
        } else if (currentNode.tagName === 'P' && currentMessageTitle) {
          const paragraphText = currentNode.textContent.trim();
          if (paragraphText) {
            currentMessageContent += paragraphText + '\n';
          }
        }
        currentNode = currentNode.nextElementSibling;
      }

      if (currentMessageTitle && currentMessageContent) {
        topicData[topicName].push({ messageTitle: currentMessageTitle, messageContent: currentMessageContent });
      }
    });

    const leftPanel = document.getElementById('leftPanel');
    leftPanel.innerHTML = '';

    Object.keys(topicData).forEach(topicName => {
      const topicElement = document.createElement('div');
      topicElement.classList.add('topic');
      topicElement.textContent = topicName;
      topicElement.addEventListener('click', () => {
        showMessages(topicName, topicData[topicName]);
        highlightSelectedTopic(topicElement);
        updatePageTitle(topicName);
      });
      leftPanel.appendChild(topicElement);
    });

  } catch (error) {
    console.error('Error loading data from Google Docs:', error.message);
    const rightPanel = document.getElementById('rightPanel');
    rightPanel.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

function highlightSelectedTopic(selectedTopicElement) {
  const topics = document.querySelectorAll('.topic');
  topics.forEach(topic => {
    topic.classList.remove('selected');
  });
  selectedTopicElement.classList.add('selected');
}

function showMessages(topicName, messages) {
  const rightPanel = document.getElementById('rightPanel');
  rightPanel.innerHTML = '';

  if (messages.length === 0) {
    rightPanel.innerHTML = '<p>No messages found for this topic.</p>';
    return;
  }

  messages.forEach((message, index) => {
    const messageBox = document.createElement('div');
    messageBox.classList.add('message-box');

    const messageTitle = document.createElement('div');
    messageTitle.classList.add('message-title');
    messageTitle.textContent = message.messageTitle;
    messageBox.appendChild(messageTitle);

    const messageContent = document.createElement('p');
    messageContent.textContent = message.messageContent;
    messageBox.appendChild(messageContent);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const whatsappButton = document.createElement('button');
    whatsappButton.classList.add('whatsapp-button');
    whatsappButton.innerHTML = '<i class="fab fa-whatsapp"></i> Share on WhatsApp';
    whatsappButton.addEventListener('click', () => shareOnWhatsApp(message.messageContent));
    buttonContainer.appendChild(whatsappButton);

    const copyButton = document.createElement('button');
    copyButton.classList.add('copy-button');
    copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy to Clipboard';
    copyButton.addEventListener('click', () => copyToClipboard(message.messageContent, copyButton));
    buttonContainer.appendChild(copyButton);

    messageBox.appendChild(buttonContainer);

    rightPanel.appendChild(messageBox);
  });
}

function shareOnWhatsApp(message) {
  const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

function copyToClipboard(message, button) {
  navigator.clipboard.writeText(message)
    .then(() => {
      console.log('Message copied to clipboard:', message);
      showPopup(button, 'Done!');
      button.classList.add('clicked');
      setTimeout(() => {
        button.classList.remove('clicked');
      }, 2000); // Remove clicked class after 2 seconds
    })
    .catch(error => {
      console.error('Failed to copy message to clipboard:', error);
      showErrorNotification('Failed to copy message to clipboard.');
    });
}

function showPopup(button, message) {
  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.textContent = message;
  button.appendChild(popup);

  setTimeout(() => {
    popup.classList.add('show');
  }, 10);

  setTimeout(() => {
    popup.classList.remove('show');
    button.removeChild(popup);
  }, 2000);
}

function showErrorNotification(message) {
  const errorNotification = document.createElement('div');
  errorNotification.classList.add('error-notification');
  errorNotification.textContent = message;
  document.body.appendChild(errorNotification);

  setTimeout(() => {
    document.body.removeChild(errorNotification);
  }, 3000);
}

function updatePageTitle(topicName) {
  const pageTitleElement = document.getElementById('pageTitle');
  pageTitleElement.textContent = `${topicName.replace(/^\s*\d+(?:\.\d+)?[\s.]+\s*/, '')}`;
}

const googleDocsUrl = 'https://docs.google.com/document/d/e/2PACX-1vSndaJ4n7JOTbhW97WLr97OS4m_hiR8QH7gLQGN8gI2Te0dBAhGSJiiQx_W_dF6uH7_5MOPC4jWVggc/pub';
loadDataFromGoogleDocs(googleDocsUrl);
