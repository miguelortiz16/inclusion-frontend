interface GooglePaymentsApi {
  isReadyToPay(request: any): Promise<{ result: boolean }>;
  PaymentsClient: new (options: { environment: 'TEST' | 'PRODUCTION' }) => {
    loadPaymentData(request: any): Promise<any>;
  };
}

interface Window {
  google?: {
    payments?: {
      api: GooglePaymentsApi;
    };
  };
} 