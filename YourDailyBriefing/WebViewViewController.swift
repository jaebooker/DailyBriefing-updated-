//
//  WebViewViewController.swift
//  YourDailyBriefing
//
//  Created by Jaeson Booker on 3/29/17.
//  Copyright © 2017 Jaeson Booker. All rights reserved.
//

import UIKit

class WebViewViewController: UIViewController {
    var url: String?

    @IBOutlet weak var WebView: UIWebView!
    override func viewDidLoad() {
        super.viewDidLoad()
        WebView.loadRequest(URLRequest(url: URL(string: url!)!))
        // Do any additional setup after loading the view.
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

}
