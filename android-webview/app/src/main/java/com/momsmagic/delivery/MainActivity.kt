package com.momsmagic.delivery

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Bundle
import android.webkit.*
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * MainActivity - Loads the delivery location HTML map inside a WebView.
 * Handles GPS permission, JavaScript bridge, and geolocation for WebView.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var geoCallback: GeolocationPermissions.Callback? = null
    private var geoOrigin: String? = null

    companion object {
        private const val LOCATION_PERMISSION_CODE = 1001
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Make fullscreen
        window.statusBarColor = 0xFF0B0E14.toInt()

        webView = WebView(this)
        setContentView(webView)

        // WebView settings
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            setGeolocationEnabled(true)
            allowFileAccess = true
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        // JavaScript interface bridge
        webView.addJavascriptInterface(AndroidBridge(), "AndroidBridge")

        // Handle geolocation permission requests from WebView
        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                geoOrigin = origin
                geoCallback = callback
                if (hasLocationPermission()) {
                    callback?.invoke(origin, true, false)
                } else {
                    requestLocationPermission()
                }
            }
        }

        webView.webViewClient = WebViewClient()

        // Request location permission upfront
        if (!hasLocationPermission()) {
            requestLocationPermission()
        }

        // Load local HTML file
        webView.loadUrl("file:///android_asset/index.html")
    }

    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestLocationPermission() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ),
            LOCATION_PERMISSION_CODE
        )
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == LOCATION_PERMISSION_CODE) {
            val granted = grantResults.isNotEmpty() &&
                    grantResults[0] == PackageManager.PERMISSION_GRANTED
            geoCallback?.invoke(geoOrigin, granted, false)
            if (!granted) {
                Toast.makeText(this, "Location permission is needed for delivery", Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    /**
     * JavaScript bridge - receives data from the HTML/JS map.
     */
    inner class AndroidBridge {
        @JavascriptInterface
        fun onLocationSelected(lat: Double, lng: Double, address: String, distance: Double, deliverable: Boolean) {
            runOnUiThread {
                // You can use this data to update your app state, send to server, etc.
                val status = if (deliverable) "Deliverable" else "Out of Range"
                Toast.makeText(
                    this@MainActivity,
                    "📍 $address\n📏 ${distance}km - $status",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }

        @JavascriptInterface
        fun onLocationConfirmed(lat: Double, lng: Double, address: String) {
            runOnUiThread {
                Toast.makeText(
                    this@MainActivity,
                    "✅ Delivery location confirmed!\n$address",
                    Toast.LENGTH_LONG
                ).show()
                // TODO: Pass this data to your order flow / API
            }
        }
    }
}
