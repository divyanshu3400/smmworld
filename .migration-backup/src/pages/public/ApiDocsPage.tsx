export default function ApiDocsPage() {
  const apiKey = 'YOUR_API_KEY'
  const apiUrl = 'https://ssmm.in/v2'

  const codeExamples = {
    php: `<?php
// Initialize API
$api_url = 'https://ssmm.in/v2';
$api_key = 'YOUR_API_KEY';

// Get Services
function getServices() {
    global $api_url, $api_key;
    $post = [
        'key' => $api_key,
        'action' => 'services'
    ];
    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post));
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result);
}

// Create Order
function createOrder($service, $link, $quantity) {
    global $api_url, $api_key;
    $post = [
        'key' => $api_key,
        'action' => 'add',
        'service' => $service,
        'link' => $link,
        'quantity' => $quantity
    ];
    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post));
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result);
}

// Get Order Status
function getOrderStatus($order_id) {
    global $api_url, $api_key;
    $post = [
        'key' => $api_key,
        'action' => 'status',
        'order' => $order_id
    ];
    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post));
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result);
}

// Get Balance
function getBalance() {
    global $api_url, $api_key;
    $post = [
        'key' => $api_key,
        'action' => 'balance'
    ];
    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post));
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result);
}

// Usage Examples
$services = getServices();
$balance = getBalance();
$order = createOrder(1, 'https://instagram.com/username', 100);
$status = getOrderStatus($order->order);
?>`,
    python: `import requests

API_URL = 'https://ssmm.in/v2'
API_KEY = 'YOUR_API_KEY'

def api_request(data):
    data['key'] = API_KEY
    response = requests.post(API_URL, data=data)
    return response.json()

# Get Services
def get_services():
    return api_request({'action': 'services'})

# Create Order
def create_order(service, link, quantity):
    return api_request({
        'action': 'add',
        'service': service,
        'link': link,
        'quantity': quantity
    })

# Get Order Status
def get_order_status(order_id):
    return api_request({
        'action': 'status',
        'order': order_id
    })

# Get Balance
def get_balance():
    return api_request({'action': 'balance'})

# Usage Examples
services = get_services()
balance = get_balance()
order = create_order(1, 'https://instagram.com/username', 100)
status = get_order_status(order['order'])`,
    javascript: `const API_URL = 'https://ssmm.in/v2';
const API_KEY = 'YOUR_API_KEY';

async function apiRequest(data) {
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);

    Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
    });

    const response = await fetch(API_URL, {
        method: 'POST',
        body: formData
    });

    return response.json();
}

// Get Services
async function getServices() {
    return apiRequest({ action: 'services' });
}

// Create Order
async function createOrder(service, link, quantity) {
    return apiRequest({
        action: 'add',
        service,
        link,
        quantity
    });
}

// Get Order Status
async function getOrderStatus(orderId) {
    return apiRequest({
        action: 'status',
        order: orderId
    });
}

// Get Balance
async function getBalance() {
    return apiRequest({ action: 'balance' });
}

// Usage Examples
const services = await getServices();
const balance = await getBalance();
const order = await createOrder(1, 'https://instagram.com/username', 100);
const status = await getOrderStatus(order.order);`,
  }

  const endpoints = [
    {
      name: 'services',
      description: 'Get list of all available services',
      parameters: [],
      response: `[
  {
    "service": 1,
    "name": "Instagram Followers [High Quality]",
    "type": "Followers",
    "rate": "0.50",
    "min": "50",
    "max": "10000"
  },
  ...
]`,
    },
    {
      name: 'add',
      description: 'Create a new order',
      parameters: [
        { name: 'service', type: 'integer', required: true, description: 'Service ID' },
        { name: 'link', type: 'string', required: true, description: 'Link to the profile/post' },
        { name: 'quantity', type: 'integer', required: true, description: 'Quantity to order' },
      ],
      response: `{
  "order": 12345
}`,
    },
    {
      name: 'status',
      description: 'Get order status',
      parameters: [
        { name: 'order', type: 'integer', required: true, description: 'Order ID' },
      ],
      response: `{
  "order": 12345,
  "status": "completed",
  "charge": "0.50",
  "start_count": 100,
  "remains": 0,
  "currency": "USD"
}`,
    },
    {
      name: 'balance',
      description: 'Get your account balance',
      parameters: [],
      response: `{
  "balance": "100.50",
  "currency": "USD"
}`,
    },
  ]

  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
            API Documentation
          </div>
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl mb-4">
            Integrate SMMHub API
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Use our powerful API to automate your social media marketing.
            Build your own SMM panel or integrate our services into your existing platform.
          </p>
        </div>

        {/* Quick Start */}
        <div className="rounded-2xl bg-card border border-border p-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Start</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">API URL</h3>
              <code className="block p-3 rounded-lg bg-muted text-sm text-emerald-500 font-mono">
                {apiUrl}
              </code>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Your API Key</h3>
              <code className="block p-3 rounded-lg bg-muted text-sm text-emerald-500 font-mono">
                {apiKey}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Get your API key from the dashboard after signing up
              </p>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-8">Available Endpoints</h2>
          <div className="space-y-6">
            {endpoints.map((endpoint) => (
              <div key={endpoint.name} className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium">
                      POST
                    </span>
                    <code className="text-lg font-semibold text-foreground">action={endpoint.name}</code>
                  </div>
                  <p className="text-muted-foreground">{endpoint.description}</p>
                </div>

                {endpoint.parameters.length > 0 && (
                  <div className="p-6 border-b border-border bg-muted/30">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Parameters</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-muted-foreground">
                              <th className="pr-4 pb-2">Name</th>
                              <th className="pr-4 pb-2">Type</th>
                              <th className="pr-4 pb-2">Required</th>
                              <th className="pb-2">Description</th>
                            </tr>
                          </thead>
                          <tbody className="text-foreground">
                            {endpoint.parameters.map((param) => (
                              <tr key={param.name}>
                                <td className="pr-4 py-1 font-mono text-emerald-500">{param.name}</td>
                                <td className="pr-4 py-1">{param.type}</td>
                                <td className="pr-4 py-1">
                                  {param.required ? (
                                    <span className="text-emerald-500">Yes</span>
                                  ) : (
                                    <span className="text-muted-foreground">No</span>
                                  )}
                                </td>
                                <td className="py-1 text-muted-foreground">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Response</h4>
                  <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-sm text-muted-foreground font-mono">
                    {endpoint.response}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Examples */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-8">Code Examples</h2>
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="flex border-b border-border">
              {Object.keys(codeExamples).map((lang) => (
                <button
                  key={lang}
                  className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                    lang === 'javascript'
                      ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="p-6 overflow-x-auto">
              <pre className="text-sm text-muted-foreground font-mono">
                {codeExamples.javascript}
              </pre>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl mb-4">
              Ready to Start Using the API?
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Sign up now and get instant access to our API. Start integrating social media services into your platform today.
            </p>
            <a
              href="/signup"
              className="inline-flex px-8 py-4 rounded-full bg-white text-emerald-600 font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Your API Key
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
