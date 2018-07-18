import {INativeAudioMetadata, IOptions} from "./";
import {ITokenizer} from "strtok3";
import * as fileType from "file-type";
import * as MimeType from "media-typer";
import {Promise} from "es6-promise";

import * as _debug from "debug";

const debug = _debug("music-metadata:parser:factory");

export interface ITokenParser {
  parse(tokenizer: ITokenizer, options: IOptions): Promise<INativeAudioMetadata>;
}

export class ParserFactory {

  /**
   *  Parse metadata from tokenizer
   * @param {ITokenizer} tokenizer
   * @param {string} contentType
   * @param {IOptions} opts
   * @returns {Promise<INativeAudioMetadata>}
   */
  public static parse(tokenizer: ITokenizer, opts: IOptions = {}): Promise<INativeAudioMetadata> {

    // Resolve parser based on MIME-type or file extension
    let parserId;

    if (opts.contentType) {
      parserId = ParserFactory.getParserIdForMimeType(opts.contentType) || ParserFactory.getParserIdForExtension(opts.contentType);
      if (!parserId) {
        debug("No parser found for MIME-type:" + opts.contentType);
      }
    }

    if (!parserId && opts.path) {
      parserId = ParserFactory.getParserIdForExtension(opts.path);
      if (!parserId) {
        debug("No parser found for path:" + opts.path);
      }
    }

    if (!parserId) {
      // No MIME-type mapping found
      debug("Try to determine type based content...");

      const buf = Buffer.alloc(4100);
      return tokenizer.peekBuffer(buf).then(() => {
        const guessedType = fileType(buf);
        if (!guessedType)
          throw new Error("Failed to guess MIME-type");
        parserId = ParserFactory.getParserIdForMimeType(guessedType.mime);
        if (!parserId)
          throw new Error("Guessed MIME-type not supported: " + guessedType.mime);
        return ParserFactory.loadParser(parserId, opts).then(parser => {
          return parser.parse(tokenizer, opts);
        });
      });
    }

    // Parser found, execute parser
    return ParserFactory.loadParser(parserId, opts).then(parser => {
      return parser.parse(tokenizer, opts);
    });
  }

  /**
   * @param filePath Path, filename or extension to audio file
   * @return Parser sub-module name
   */
  private static getParserIdForExtension(filePath: string): string {
    if (!filePath)
      return;

    const extension = filePath.slice((filePath.lastIndexOf(".") - 1 >>> 0) + 1) || filePath;

    switch (extension) {

      case ".mp2":
      case ".mp3":
      case ".m2a":
        return 'mpeg';

      case ".ape":
        return 'apev2';

      case ".aac":
      case ".mp4":
      case ".m4a":
      case ".m4b":
      case ".m4pa":
      case ".m4v":
      case ".m4r":
      case ".3gp":
        return 'mp4';

      case ".wma":
      case ".wmv":
      case ".asf":
        return 'asf';

      case ".flac":
        return 'flac';

      case ".ogg":
      case ".ogv":
      case ".oga":
      case ".ogx":
      case ".opus": // recommended filename extension for Ogg Opus files
        return 'ogg';

      case ".aif":
      case ".aiff":
      case ".aifc":
        return 'aiff';

      case ".wav":
        return 'riff';

      case ".wv":
      case ".wvp":
        return 'wavpack';
    }
  }

  /**
   * @param {string} mimeType MIME-Type, extension, path or filename
   * @returns {string} Parser sub-module name
   */
  private static getParserIdForMimeType(mimeType: string): string {

    let mime;
    try {
      mime = MimeType.parse(mimeType);
    } catch (err) {
      debug(`Invalid MIME-type: ${mimeType}`);
      return;
    }

    const subType = mime.subtype.indexOf('x-') === 0 ? mime.subtype.substring(2) : mime.subtype;

    switch (mime.type) {

      case 'audio':
        switch (subType) {

          case 'mpeg':
            return 'mpeg'; // ToDo: handle ID1 header as well

          case 'flac':
            return 'flac';

          case 'ape':
          case 'monkeys-audio':
            return 'apev2';

          case 'mp4':
          case 'aac':
          case 'aacp':
          case 'm4a':
            return 'mp4';

          case 'ogg': // RFC 7845
            return 'ogg';

          case 'ms-wma':
          case 'ms-wmv':
          case 'ms-asf':
            return 'asf';

          case 'aiff':
          case 'aif':
          case 'aifc':
            return 'aiff';

          case 'vnd.wave':
          case 'wav':
          case 'wave':
            return 'riff';

          case 'wavpack':
            return 'wavpack';
        }
        break;

      case 'video':
        switch (subType) {

          case 'ms-asf':
          case 'ms-wmv':
            return 'asf';

          case 'ogg':
            return 'ogg';
        }
        break;

      case 'application':
        switch (subType) {

          case 'vnd.ms-asf':
            return 'asf';

          case 'ogg':
            return 'ogg';
        }
        break;
    }
  }

  private static loadParser(moduleName: string, options: IOptions): Promise<ITokenParser> {
    debug(`Lazy loading parser: ${moduleName}`);
    if (options.loadParser) {
      return options.loadParser(moduleName).then(parser => {
        if (!parser) {
          throw new Error(`options.loadParser failed to resolve module "${moduleName}".`);
        }
        return parser;
      });
    }
    const module = require('./' + moduleName);
    return Promise.resolve(new module.default());
  }

  // ToDo: expose warnings to API
  private warning: string[] = [];

}
