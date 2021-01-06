import {Component, Inject} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from "@angular/cdk/drag-drop";
import {TranslocoService} from "@ngneat/transloco";
import { DOCUMENT } from '@angular/common';
import {MatDialog} from "@angular/material/dialog";
import {DialogComponent} from "./components/dialog/dialog.component";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MatSnackBar} from "@angular/material/snack-bar";
import {AuthService} from "./services/auth.service";
import firebase from 'firebase/app';
import 'firebase/auth';
import {AngularFireAuth} from "@angular/fire/auth";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  dir: 'ltr' | 'rtl' = 'ltr';

  lists:any = {
    'a-title-todo': [],
    'b-title-progress': [],
    'c-title-testing': [],
    'd-title-done': []
  };

  constructor(private translocoService: TranslocoService,
              private afAuth: AngularFireAuth,
              private dialog: MatDialog,
              private authService: AuthService,
              private formBuilder: FormBuilder,
              private snackbar: MatSnackBar,
              @Inject(DOCUMENT) private document: Document) {

    const storageItems = localStorage.getItem('list');
    if(storageItems) { this.lists = JSON.parse(storageItems); }

    const storageLang = localStorage.getItem('lang');
    if(storageLang) { this.setLang(storageLang, false); }

    this.buildForm();
    this.dir = this.translocoService.getActiveLang() === 'he' ? 'rtl' : 'ltr';

    this.checkUser();
  }

  register() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.oAuthLogin(provider);
  }
  oAuthLogin(provider: any) {
    return this.afAuth.signInWithPopup(provider)
      .then(credential => {
        return this.checkUser(credential.user);
      })
      .catch((error => console.log(error) ));
  }
  user: any = null;
  checkUser(user?) {
    this.authService.user.subscribe((userDoc) => {
      if(!userDoc) {
        this.authService.createUserDoc({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid,
          board: this.lists
        }).then((useDoc => {
          this.user = useDoc;
        }))
      } else {
        this.user = userDoc;
        this.lists = userDoc.board;
      }
    })
  }
  logout() {
    this.authService.logout();
  }

  taskForm: FormGroup;
  buildForm() {
    this.taskForm = this.formBuilder.group({
      task: [null, [Validators.required, Validators.maxLength(80)]]
    })
  }
  get task() {
    return this.taskForm.get('task');
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
    this.saveList();
  }

  saveList(message: string = 'snackbar.success') {
    // localStorage.setItem('list', JSON.stringify(this.lists));
    this.authService.saveBoard(this.user.uid, this.lists).then((res) => {
      this.snackbar.open(this.translocoService.translate(message), null, {
        panelClass: 'success',
        direction: this.dir,
        duration: 1500
      });
    }, (error) => {
      console.log(error);
      this.snackbar.open(this.translocoService.translate('snackbar.error'), null, {
        panelClass: 'error',
        direction: this.dir,
        duration: 1500
      });
    })
  }

  setLang(langType, save = true) {
    const allowedLang = this.translocoService.getAvailableLangs();
    if(allowedLang.includes(langType)) {
      this.translocoService.setActiveLang(langType);
      const dir = (langType === 'he' || langType === 'ar') ? 'rtl' : 'ltr';
      this.dir = dir;
      this.document.getElementsByTagName('html')[0].setAttribute('dir', dir);
      this.document.getElementsByTagName('html')[0].setAttribute('lang', langType);
      if (save) {localStorage.setItem('lang', langType)}
    }
  }

  deleteItem(listKey:string, item:string, itemIndex:number) {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '400px',
      data: {
        item
      }
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        localStorage.clear();
        this.lists[listKey] = this.lists[listKey].filter((item, index) => index !== itemIndex);
        this.saveList('snackbar.deleted');
      }
    })
  }


  addTask() {
    if (this.task.valid && this.task.value !== '') {
      this.lists['a-title-todo'].push(this.task.value);
      this.saveList('snackbar.added');
      this.taskForm.reset();
    } else {
      this.snackbar.open(this.translocoService.translate('invalidTask'), null,
        {
          direction: this.dir,
          duration: 1500,
          panelClass: 'error'
        })
    }
  }


  removeAll() {
    const dialog = this.dialog.open(DialogComponent, {
      width: '420px'
    });
    dialog.afterClosed().subscribe((result) => {
      if (result){
        this.lists = {
          'a-title-todo': [],
          'b-title-progress': [],
          'c-title-testing': [],
          'd-title-done': []
        };
        this.saveList('snackbar.deleted');
      }
    });
  }


  // Working with arrays
  itemInArray = 'demo';
  async addToArray() {
    await this.authService.addToArray(this.user.uid, this.itemInArray);
    this.snackbar.open(this.translocoService.translate('snackbar.success'), null,
      {
        direction: this.dir,
        duration: 1500,
        panelClass: 'success'
      });
  }
  async removeFromArray() {
    await this.authService.removeFromArray(this.user.uid, this.itemInArray);
    this.snackbar.open(this.translocoService.translate('snackbar.success'), null,
      {
        direction: this.dir,
        duration: 1500,
        panelClass: 'success'
      })
  }

}
