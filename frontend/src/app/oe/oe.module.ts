import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCollapse, NgbCollapseModule, NgbRadioGroup, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faFilter, faAngleDown, faAngleUp, faAngleRight, faAngleLeft, faBolt, faChartArea, faCogs, faCubes, faHammer, faDatabase, faExchangeAlt, faInfoCircle,
  faLink, faList, faSearch, faCaretUp, faCaretDown, faTachometerAlt, faThList, faTint, faTv, faAngleDoubleDown, faSortUp, faAngleDoubleUp, faChevronDown,
  faFileAlt, faRedoAlt, faArrowAltCircleRight, faExternalLinkAlt, faBook, faListUl, faDownload, faQrcode, faArrowRightArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NgbNavModule, NgbTooltipModule, NgbButtonsModule, NgbPaginationModule, NgbDropdownModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OpEnergyApiService } from './services/op-energy.service';

@NgModule({
  declarations: [
  ],
  imports: [
  ],
  providers: [
    OpEnergyApiService,
  ],
  exports: [
  ]
})
export class OpEnergyModule {
  constructor(library: FaIconLibrary) {
  }
}
