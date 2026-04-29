import Foundation
import Vision
import ImageIO

struct OCRPayload: Encodable {
  let ok: Bool
  let lines: [String]
  let fullText: String
}

func printJson(_ payload: OCRPayload) {
  let encoder = JSONEncoder()
  encoder.outputFormatting = [.withoutEscapingSlashes]

  if let data = try? encoder.encode(payload), let text = String(data: data, encoding: .utf8) {
    FileHandle.standardOutput.write(Data(text.utf8))
  } else {
    FileHandle.standardOutput.write(Data("{\"ok\":false,\"lines\":[],\"fullText\":\"\"}".utf8))
  }
}

guard CommandLine.arguments.count > 1 else {
  printJson(OCRPayload(ok: false, lines: [], fullText: ""))
  exit(1)
}

let imagePath = CommandLine.arguments[1]
let imageURL = URL(fileURLWithPath: imagePath)

guard
  let source = CGImageSourceCreateWithURL(imageURL as CFURL, nil),
  let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
else {
  printJson(OCRPayload(ok: false, lines: [], fullText: ""))
  exit(2)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.minimumTextHeight = 0.015
request.recognitionLanguages = ["zh-Hans", "en-US"]

let handler = VNImageRequestHandler(cgImage: image, options: [:])

do {
  try handler.perform([request])

  let lines = (request.results ?? [])
    .compactMap { observation -> String? in
      guard let candidate = observation.topCandidates(1).first?.string.trimmingCharacters(in: .whitespacesAndNewlines) else {
        return nil
      }

      return candidate.isEmpty ? nil : candidate
    }
    .filter { !$0.isEmpty }

  let payload = OCRPayload(
    ok: true,
    lines: lines,
    fullText: lines.joined(separator: "\n")
  )
  printJson(payload)
} catch {
  printJson(OCRPayload(ok: false, lines: [], fullText: ""))
  exit(3)
}
