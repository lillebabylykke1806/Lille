import Foundation
import Capacitor
import UIKit

@objc(ScreenshotPlugin)
public class ScreenshotPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ScreenshotPlugin"
    public let jsName = "Screenshot"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startWatching", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopWatching", returnType: CAPPluginReturnPromise),
    ]

    private var observer: NSObjectProtocol?

    @objc func startWatching(_ call: CAPPluginCall) {
        if observer == nil {
            observer = NotificationCenter.default.addObserver(
                forName: UIApplication.userDidTakeScreenshotNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                self?.notifyListeners("screenshot", data: [:])
            }
        }
        call.resolve()
    }

    @objc func stopWatching(_ call: CAPPluginCall) {
        if let observer {
            NotificationCenter.default.removeObserver(observer)
            self.observer = nil
        }
        call.resolve()
    }
}
