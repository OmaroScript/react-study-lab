import ExpoModulesCore
import UIKit

// Módulo nativo iOS escrito con la Expo Modules API.
// JS lo obtiene con requireNativeModule('DeviceInfo').
public class DeviceInfoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DeviceInfo")

    // Eventos que el módulo puede emitir hacia JS.
    Events("onPing")

    // Constante: se calcula una vez y se expone como propiedad síncrona.
    Constant("platform") {
      "ios"
    }

    // Función síncrona: bloquea el hilo JS mientras se ejecuta, úsala solo para cosas rápidas.
    Function("getDeviceSummary") { () -> [String: String] in
      let device = UIDevice.current
      return [
        "model": device.model,
        "systemName": device.systemName,
        "systemVersion": device.systemVersion
      ]
    }

    // Función asíncrona: se resuelve como Promise en JS.
    AsyncFunction("getBatteryLevelAsync") { () -> Double in
      let device = UIDevice.current
      device.isBatteryMonitoringEnabled = true
      // -1 significa "desconocido" (por ejemplo, en el simulador).
      return Double(device.batteryLevel)
    }.runOnQueue(.main)

    // Emite un evento de vuelta a JS para demostrar la comunicación nativo -> JS.
    AsyncFunction("pingAsync") { (message: String) in
      self.sendEvent("onPing", [
        "message": message,
        "receivedAt": Date().timeIntervalSince1970 * 1000
      ])
    }
  }
}
