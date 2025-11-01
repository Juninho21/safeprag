package com.safeprag.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    if (getBridge() != null && getBridge().getWebView() != null) {
      // Força carregamento fresco da página remota
      getBridge().getWebView().clearCache(true);
      WebSettings settings = getBridge().getWebView().getSettings();
      settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
      settings.setJavaScriptEnabled(true);
      settings.setDomStorageEnabled(true);
    }
  }
}
