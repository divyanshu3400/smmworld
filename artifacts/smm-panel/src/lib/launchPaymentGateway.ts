export interface CreateOrderResponse {
  orderId: string
  provider: string
  providerOrderId: string
  sessionId?: string
  redirectUrl?: string
  redirectParams?: Record<string, string>
  amountINR: number
}

export type PaymentFlow = 'wallet_topup' | 'public_order' | 'guest_order'

export interface CreateOrderOptions {
  amountINR: number
  flow?: PaymentFlow
  returnTo?: string
}


function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true)
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.onload = () => resolve(true)
        s.onerror = () => resolve(false)
        document.body.appendChild(s)
    })
}

async function loadCashfreeScript(): Promise<boolean> {
    if (window.Cashfree) return true
    return new Promise((resolve) => {
        const script = document.createElement('script')
        // Make sure this is v3
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })
}

export type GatewayOrder = {
    provider: 'cashfree' | 'payu' | 'razorpay'
    orderId: string
    sessionId?: string
    redirectUrl?: string
    redirectParams?: Record<string, string>
}

type LaunchCallbacks = {
    onOrderCreated: (orderId: string) => void
    onWaiting: (message: string) => void
}

export async function launchPaymentGateway(order: GatewayOrder | CreateOrderResponse, cb: LaunchCallbacks) {
    if (order.provider === 'cashfree' && order.sessionId) {
        const loaded = await loadCashfreeScript()
        if (!loaded || !window.Cashfree) {
            throw new Error('Could not load Cashfree checkout.')
        }
        const rawMode = import.meta.env.VITE_CASHFREE_MODE
        const cashfreeMode = rawMode === 'production' ? 'production' : 'sandbox'
        const cf = window.Cashfree({ mode: cashfreeMode })

        cb.onOrderCreated(order.orderId)
        cb.onWaiting('Complete the payment in the Cashfree window. Your order will be placed automatically once confirmed.')

        cf.checkout({
            paymentSessionId: order.sessionId,
            redirectTarget: '_self',
        })
        return
    }

    if (order.provider === 'payu' && order.redirectUrl && order.redirectParams) {
        cb.onOrderCreated(order.orderId)
        cb.onWaiting('You will be redirected to PayU. After paying, you will return here.')

        const form = document.createElement('form')
        form.method = 'POST'
        form.action = order.redirectUrl
        for (const [key, value] of Object.entries(order.redirectParams)) {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = value
            form.appendChild(input)
        }
        document.body.appendChild(form)
        form.submit()
        return
    }

    if (order.provider === 'razorpay') {
        const loaded = await loadRazorpayScript()
        if (!loaded) throw new Error('Could not load Razorpay checkout.')
        cb.onOrderCreated(order.orderId)
        cb.onWaiting('Complete the payment in the Razorpay window.')
        // Razorpay verify happens in its own handler; poll order status same way.
        return
    }

    throw new Error('Unsupported payment provider')
}