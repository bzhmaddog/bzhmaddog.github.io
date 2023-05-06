var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Utils {
    /**
     * Add alpha component to a RGB string
     * @param {string} str
     * @param {string} alpha
     * @returns {string}
     */
    static hexRGBToHexRGBA(str, alpha) {
        if (alpha.match(/[0-9a-f][0-9a-f]/gi)) {
            return str + alpha;
        }
        else {
            throw new TypeError("alpha must be an hex string between 00 and FF");
        }
    }
    /**
 * Add alpha component to a RGB string
 * @param {string} str
 * @param {number} alpha
 * @returns {string}
 */
    /*static hexRGBToHexRGBA(str: string, alpha: number): string {
        if (alpha >= 0 && alpha <= 255) {
            return str + alpha.toString(16)
        } else {
            throw new TypeError("alpha must be an int between 0 and 255 or a an hex string between 00 and FF")
        }
    }*/
    /**
     * Return int value of an hex color
     * @param {string} str
     * @param {string} prefix
     * @returns {number}
     */
    static hexColorToInt(str, prefix) {
        var p = prefix || "";
        return parseInt(str.replace(/^#/gi, p), 16);
    }
    /**
     * Revert RGBA components
     * @param {string} rgba
     * @returns {string} abgr string
     */
    static rgba2abgr(rgba) {
        var arr = rgba.match(/.{2}/g);
        if (arr === null) {
            throw new TypeError("Invalid rgba string");
        }
        return arr[3] + arr[2] + arr[1] + arr[0];
    }
    /**
     * Convert an hexadecimal string to an array of hex byte
     * @param {string} hex
     * @returns {array<string>}
     */
    static hexToArray(hex) {
        return hex.match(/.{2}/g) || [];
    }
    /**
     * Fetch image from server with an index used to determine position
     * @param {array} images
     * @param {number} index
     */
    static loadImagesOrdered(images) {
        var bitmaps = [];
        var cnt = 0;
        var promises = images.map(url => fetch(url));
        return Promise
            .all(promises)
            .then(responses => Promise.all(responses.map(res => res.blob())))
            .then(blobs => Promise.all(blobs.map(blob => createImageBitmap(blob))));
    }
    /**
     * Fetch image from server with an index used to determine position
     * @param {array} images
     * @param {number} index
     */
    static loadImagesOrderedAsync(images) {
        return __awaiter(this, void 0, void 0, function* () {
            var bitmaps = [];
            var cnt = 0;
            var promises = images.map(url => fetch(url));
            return yield Promise
                .all(promises)
                .then(responses => Promise.all(responses.map(res => res.blob())))
                .then(blobs => Promise.all(blobs.map(blob => createImageBitmap(blob))));
        });
    }
}
export { Utils };
//# sourceMappingURL=Utils.js.map