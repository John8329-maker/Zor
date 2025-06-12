const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Налаштування CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Обробка OPTIONS запиту
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Перевірка методу
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Метод не дозволений' })
    };
  }

  // Перевірка тіла запиту
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Відсутнє тіло запиту' })
    };
  }

  // Парсинг JSON
  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Некоректний JSON у тілі запиту' })
    };
  }

  const { prompt } = parsedBody;
  
  // Перевірка prompt
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Будь ласка, введіть коректний запит' })
    };
  }

  // Перевірка API ключа
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Серверна помилка: відсутній API ключ' })
    };
  }

  try {
    // Виклик Together AI API
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 0.9,
        stop: ['<|eot_id|>']
      })
    });

    // Обробка відповіді API
    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: `Помилка Together AI: ${response.statusText}` 
        })
      };
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Некоректна відповідь від сервісу AI' 
        })
      };
    }

    // Успішна відповідь
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ answer })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: `Внутрішня помилка сервера: ${error.message}` 
      })
    };
  }
};
