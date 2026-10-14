package expo.modules.deviceinfo

import android.content.Context
import android.os.BatteryManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Módulo nativo Android escrito con la Expo Modules API.
// JS lo obtiene con requireNativeModule('DeviceInfo').
class DeviceInfoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DeviceInfo")

    // Eventos que el módulo puede emitir hacia JS.
    Events("onPing")

    // Constante: se calcula una vez y se expone como propiedad síncrona.
    Constant("platform") {
      "android"
    }

    // Función síncrona: bloquea el hilo JS mientras se ejecuta, úsala solo para cosas rápidas.
    Function("getDeviceSummary") {
      mapOf(
        "model" to "${Build.MANUFACTURER} ${Build.MODEL}",
        "systemName" to "Android",
        "systemVersion" to Build.VERSION.RELEASE
      )
    }

    // Función asíncrona: se resuelve como Promise en JS.
    AsyncFunction("getBatteryLevelAsync") {
      val batteryManager = appContext.reactContext
        ?.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
      val percent = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
      // Normalizamos a 0..1 igual que iOS; -1 significa "desconocido".
      if (percent == null || percent < 0) -1.0 else percent / 100.0
    }

    // Emite un evento de vuelta a JS para demostrar la comunicación nativo -> JS.
    AsyncFunction("pingAsync") { message: String ->
      sendEvent("onPing", mapOf(
        "message" to message,
        "receivedAt" to System.currentTimeMillis().toDouble()
      ))
    }
  }
}
