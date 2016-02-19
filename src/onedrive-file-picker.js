'use strict';

import Api from './api';
import PickerView from './picker-view';
import extend from 'extend';
import jquery from './deps/jquery';
import Promise from './deps/promise';

const DEFAULT_OPTS = {
  // For OneDrive for Business put your resource endpoint here: https://{tenant}-my.sharepoint.com/_api/v2.0
  baseURL: 'https://api.onedrive.com/v1.0',
  accessToken: null,
  promiseLibrary: null,
};

const ONEDRIVE_FILE_PICKER_ID = 'onedrive-file-picker';
const JQUERY_PICKER_SELECTOR = '#' + ONEDRIVE_FILE_PICKER_ID;

class OneDriveFilePicker {

  /**
   * Creates a new OneDriveFilePicker instance.
   * @param {object} opts - The configuration options.
   * @param {string} [opts.baseURL=https://api.onedrive.com/v1.0] - Base URL of OneDrive REST APIs.
   * @param {string} [opts.accessToken=YOUR_ACCESS_TOKEN] - The access token to use.
   */
  constructor(opts = {}) {
    const options = extend(true, {}, DEFAULT_OPTS, opts);
    this._api = new Api({ baseURL: options.baseURL, accessToken: options.accessToken });
    this._picker = new PickerView();
    this.Promise = OneDriveFilePicker.Promise || Promise;
  }

  select() {
    jquery(JQUERY_PICKER_SELECTOR).remove();
    return this._api.fetchRootChildren().then((res) => {
      this._buildPicker(res.value).appendTo(jquery('body'));
      this._applyHandler();
      const select = new this.Promise((resolve) => {
        jquery(JQUERY_PICKER_SELECTOR + ' input.odfp-select').click(() => {
          const activeItem = jquery(JQUERY_PICKER_SELECTOR + ' .odfp-item.odfp-active');
          if (activeItem.data('folder') === 'true') {
            this._api.fetchChildren(activeItem.data('item').id).then((children) => {
              this._replaceItems(children.value);
            });
          } else {
            const activeItemData = activeItem.data('item');
            this.close();
            resolve({ action: 'select', item: activeItemData });
          }
        });
      });
      const close = new this.Promise((resolve) => {
        jquery(JQUERY_PICKER_SELECTOR + ' span.odfp-close').click(() => {
          this.close();
          resolve({ action: 'close' });
        });
      });
      return this.Promise.race([select, close]);
    });
  }

  close() {
    jquery(JQUERY_PICKER_SELECTOR).remove();
  }

  _buildPicker(items) {
    this._picker.clearRows();
    let row;
    for (let i = 0; i < items.length; i++) {
      if (i % 5 === 0) {
        row = this._picker.addRow();
      }
      row.addCol(items[i]);
    }
    return this._picker.build().attr('id', ONEDRIVE_FILE_PICKER_ID);
  }

  /**
   * Applies handler on all items.
   */
  _applyHandler() {
    const items = jquery(JQUERY_PICKER_SELECTOR + ' .odfp-item');
    // Navigation
    items.dblclick((event) => {
      const item = jquery(event.currentTarget);
      if (item.data('folder') === 'true') {
        const itemData = item.data('item');
        this._api.fetchChildren(itemData.id).then((res) => {
          this._picker.addItemToBreadcrumb(itemData);
          this._replaceItems(res.value);
        });
      }
    });
    // Selection
    items.click((event) => {
      items.removeClass('odfp-active');
      jquery(event.currentTarget).addClass('odfp-active');
    });
    // Breadcrumb
    jquery(JQUERY_PICKER_SELECTOR + ' .odfp-breadcrumb .odfp-breadcrumb-item').click((event) => {
      const item = jquery(event.currentTarget);
      if (!item.hasClass('odfp-active')) {
        const itemData = item.data('item');
        const itemId = itemData.id;
        let promise;
        if (itemData.root) {
          promise = this._api.fetchRootChildren();
        } else if (itemData.search) {
          promise = this._api.search(itemData.search);
        } else {
          promise = this._api.fetchChildren(itemId);
        }
        promise.then((res) => {
          this._picker.setBreadcrumbTo(itemId);
          this._replaceItems(res.value);
        });
      }
    });
    // Search
    const searchInputId = JQUERY_PICKER_SELECTOR + ' .odfp-search .odfp-search-input';
    const submitInputId = JQUERY_PICKER_SELECTOR + ' .odfp-search .odfp-search-submit';
    jquery(searchInputId).keypress((event) => {
      if (event.which === 13) {
        event.preventDefault();
        jquery(submitInputId).click();
      }
    });
    jquery(submitInputId).click(() => {
      const search = jquery(searchInputId).val();
      this._api.search(search).then((res) => {
        this._picker.reinitBreadcrumb();
        this._picker.addSearchToBreadcrumb(search);
        this._replaceItems(res.value);
      });
    });
  }

  /**
   * Replaces items in the dom and applies the handlers.
   */
  _replaceItems(items) {
    const rows = this._buildPicker(items).find('.odfp-content');
    jquery(JQUERY_PICKER_SELECTOR + ' .odfp-content').replaceWith(rows);
    this._applyHandler();
  }

}

/**
 * Sets the Promise library class to use.
 */
OneDriveFilePicker.promiseLibrary = (promiseLibrary) => {
  OneDriveFilePicker.Promise = promiseLibrary;
};

export default OneDriveFilePicker;
