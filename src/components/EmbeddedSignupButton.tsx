'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare const FB: any;

interface EmbeddedSignupButtonProps {
  onSuccess: (code: string, sessionInfo: any) => void;
  onError?: (error: string) => void;
}

export default function EmbeddedSignupButton({ onSuccess, onError }: EmbeddedSignupButtonProps) {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID || '';
  const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID || '';
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const esInProgress = useRef(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const popupWindowRef = useRef<Window | null>(null);

  const stopPolling = () => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const sessionInfoOuter = useRef<any>(null);

  const clearEsState = () => {
    esInProgress.current = false;
    popupWindowRef.current = null;
    stopPolling();
  };

  const fbLoginCallback = (response: any) => {
    clearEsState();
    if (response?.authResponse?.code) {
      let attempts = 0;
      const checkSession = setInterval(() => {
        if (sessionInfoOuter.current || attempts > 20) {
          clearInterval(checkSession);
          onSuccess(response.authResponse.code, sessionInfoOuter.current || {});
        }
        attempts++;
      }, 100);
    } else {
      onError?.('User cancelled or Facebook login failed');
    }
  };

  const launchWhatsAppSignup = () => {
    if (typeof FB === 'undefined') {
      onError?.('Facebook SDK not loaded yet. Please try again.');
      return;
    }

    esInProgress.current = true;
    
    const originalWindowOpen = window.open;
    window.open = function (...args) {
      const popup = originalWindowOpen.apply(window, args);
      if (popup) {
        popupWindowRef.current = popup;
      }
      window.open = originalWindowOpen;
      return popup;
    };

    FB.login(fbLoginCallback, {
      config_id: configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: '',
        sessionInfoVersion: '2',
      }
    });

    stopPolling();
    pollTimerRef.current = setInterval(() => {
      if (!esInProgress.current) {
        stopPolling();
        return;
      }
      const popup = popupWindowRef.current;
      if (popup && popup.closed) {
        clearEsState();
        onError?.('Login window closed');
      }
    }, 500);
  };

  useEffect(() => {
    const initFB = () => {
      if (!appId) {
        console.error("Missing NEXT_PUBLIC_META_APP_ID in .env");
        return;
      }
      FB.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v19.0',
      });
      setIsSdkLoaded(true);
    };

    if (typeof FB !== 'undefined') {
      initFB();
    } else {
      (window as any).fbAsyncInit = initFB;
    }

    const cb = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.data.current_step) {
            clearEsState();
          } else {
            sessionInfoOuter.current = data;
          }
        }
      } catch {}
    };
    window.addEventListener('message', cb);
    return () => {
      window.removeEventListener('message', cb);
      stopPolling();
    };
  }, [appId]);

  return (
    <>
      <Script 
        src="https://connect.facebook.net/en_US/sdk.js" 
        strategy="afterInteractive" 
      />
      <button
        onClick={launchWhatsAppSignup}
        disabled={!isSdkLoaded}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1877F2] text-white text-sm font-semibold rounded-xl hover:bg-[#1565C0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        {isSdkLoaded ? 'Login with Facebook' : 'Loading...'}
      </button>
    </>
  );
}
