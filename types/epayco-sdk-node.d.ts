declare module 'epayco-sdk-node' {
  interface EpaycoConfig {
    apiKey: string;
    privateKey: string;
    lang: string;
    test: boolean;
  }

  interface TokenResponse {
    success: boolean;
    data: {
      id: string;
    };
  }

  interface CustomerResponse {
    success: boolean;
    data: {
      customerId: string;
    };
  }

  interface SubscriptionResponse {
    success: boolean;
    data: {
      subscriptionId: string;
    };
  }

  interface EpaycoClient {
    token: {
      create(creditInfo: {
        "card[number]": string;
        "card[exp_year]": string;
        "card[exp_month]": string;
        "card[cvc]": string;
        hasCvv: boolean;
      }): Promise<TokenResponse>;
    };
    customers: {
      create(customerInfo: {
        token_card: string;
        name: string;
        last_name: string;
        email: string;
        default: boolean;
        city: string;
        address: string;
        phone: string;
        cell_phone: string;
      }): Promise<CustomerResponse>;
    };
    subscriptions: {
      create(subscriptionInfo: {
        id_plan: string;
        customer: string;
        token_card: string;
        doc_type: string;
        doc_number: string;
        url_confirmation: string;
        method_confirmation: string;
      }): Promise<SubscriptionResponse>;
    };
  }

  function epayco(config: EpaycoConfig): EpaycoClient;
  export = epayco;
} 