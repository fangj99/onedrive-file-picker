'use strict';

const picker =
`<div class="onedrive-file-picker">
  <div class="odfp-body">
    <div class="odfp-header">
      <span>Select a file</span>
      <span class="odfp-close">Close</span>
    </div>
    <div class="odfp-content">
      <div onedrive-insert-breadcrumb></div>
      <div class="odfp-search">
        <input class="odfp-search-input" type="text" />
        <input class="odfp-search-submit" type="submit" value="Search" />
      </div>
      <div onedrive-insert-rows></div>
    </div>
    <div class="odfp-footer">
      <input class="odfp-select" type="submit" value="Select" />
    </div>
  </div>
</div>`;

export default picker;
