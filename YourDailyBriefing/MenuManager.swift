//
//  MenuManager.swift
//  YourDailyBriefing
//
//  Created by Jaeson Booker on 3/29/17.
//  Copyright © 2017 Jaeson Booker. All rights reserved.
//

import UIKit

class MenuManager: NSObject, UITableViewDelegate, UITableViewDataSource {
    let blackView = UIView()
    let menuTableView = UITableView()
    let arrayOfSources = ["bbc-news","al-jazeera-english","the-washington-post","associated-press","business-insider","cnn","google-news","independent","new-scientist","new-york-magazine","reddit-r-all","the-telegraph","the-hindu","reuters","the-new-york-times"]
    var mainVC: ViewController?
    public func openMenu(){
        if let window = UIApplication.shared.keyWindow {
            blackView.frame = window.frame
            blackView.backgroundColor = UIColor(white: 0, alpha: 0.5)
            blackView.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(self.dismissMenu)))
            
            let height: CGFloat = 500
            let y = window.frame.height - height
            menuTableView.frame = CGRect(x: 0, y: window.frame.height, width: window.frame.width, height: height)
            
            window.addSubview(blackView)
            window.addSubview(menuTableView)
            UIView.animate(withDuration: 0.5, animations: {
                self.blackView.alpha = 1
                self.menuTableView.frame.origin.y = y
            })
        }
    }
    public func dismissMenu() {
        UIView.animate(withDuration: 0.5, animations: {
            self.blackView.alpha = 0
            if let window = UIApplication.shared.keyWindow {
                self.menuTableView.frame.origin.y = window.frame.height
            }
        })
    }
    func numberOfSections(in tableView: UITableView) -> Int {
        return 1
    }
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return arrayOfSources.count
    }
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "cellId", for: indexPath) as UITableViewCell
        cell.textLabel?.text = arrayOfSources[indexPath.item]
        return cell
    }
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        return 50
    }
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        if let vc = mainVC {
            vc.source = arrayOfSources[indexPath.item].lowercased()
            vc.fetchArticles(fromSource: arrayOfSources[indexPath.item].lowercased())
            dismissMenu()
        }
    }
    override init() {
        super.init()
        menuTableView.delegate = self
        menuTableView.dataSource = self
        menuTableView.isScrollEnabled = false
        menuTableView.bounces = false
        menuTableView.register(BaseViewCellTableViewCell.classForCoder(), forCellReuseIdentifier: "cellId")
        
    }
}
